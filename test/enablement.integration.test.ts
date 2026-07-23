import { execFileSync } from "node:child_process";
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

type CommandHandler = (_args: string, ctx: { cwd: string; mode: string; ui: { notify: () => void; setStatus: () => void } }) => Promise<void>;

const originalHome = process.env.HOME;
const originalStateDir = process.env.PI_CODING_AGENT_DIR;
const originalPath = process.env.PATH;
const sandboxes: string[] = [];

function git(repoPath: string, args: string[]): string {
  return execFileSync("git", ["-C", repoPath, ...args], { encoding: "utf8" });
}

function fixtureRepository() {
  const root = mkdtempSync(path.join(os.tmpdir(), "deadloop-enablement-"));
  sandboxes.push(root);
  const repoPath = path.join(root, "primary");
  mkdirSync(repoPath);
  git(repoPath, ["init", "--quiet"]);
  git(repoPath, ["config", "user.email", "test@example.com"]);
  git(repoPath, ["config", "user.name", "Test"]);
  writeFileSync(path.join(repoPath, "README.md"), "fixture\n");
  git(repoPath, ["add", "README.md"]);
  git(repoPath, ["commit", "--quiet", "-m", "initial"]);
  const barePath = path.join(root, "origin.git");
  execFileSync("git", ["clone", "--quiet", "--bare", repoPath, barePath]);
  git(repoPath, ["remote", "add", "origin", "https://github.com/owner/demo.git"]);
  writeFileSync(path.join(root, ".gitconfig"), `[url "file://${barePath}"]\n\tinsteadOf = https://github.com/owner/demo.git\n`);
  const binDir = path.join(root, "bin");
  mkdirSync(binDir);
  const gitPath = path.join(binDir, "git");
  writeFileSync(gitPath, "#!/bin/sh\nif [ \"$3 $4 $5\" = \"remote get-url origin\" ]; then echo https://github.com/owner/demo.git; else exec /usr/bin/git \"$@\"; fi\n");
  chmodSync(gitPath, 0o755);
  return { root, repoPath };
}

async function loadExtension(
  root: string,
  options: { failLabel?: boolean } = {},
): Promise<{ commands: Map<string, CommandHandler>; messages: string[] }> {
  process.env.HOME = root;
  process.env.PI_CODING_AGENT_DIR = path.join(root, ".pi", "agent");
  process.env.PATH = `${path.join(root, "bin")}:${originalPath || ""}`;
  vi.resetModules();
  const commands = new Map<string, CommandHandler>();
  const messages: string[] = [];
  // @ts-expect-error Vitest transforms this runtime extension import.
  const extension = (await import("../extensions/deadloop/index")).default;
  extension({
    exec: async (command: string, args: string[]) => {
      if (command === "git") {
        if (args.includes("get-url")) return { code: 0, stdout: "https://github.com/owner/demo.git\n", stderr: "" };
        if (args.includes("--symbolic-full-name")) return { code: 0, stdout: "", stderr: "" };
        if (args.includes("fetch")) return { code: 0, stdout: "", stderr: "" };
        if (args.includes("show")) return { code: 1, stdout: "", stderr: "missing" };
        try {
          return { code: 0, stdout: execFileSync("git", args, { encoding: "utf8" }), stderr: "" };
        } catch (error) {
          return { code: 1, stdout: "", stderr: String(error) };
        }
      }
      if (command === "gh" && args[0] === "auth") return { code: 0, stdout: "", stderr: "" };
      if (command === "gh" && args[0] === "repo") return { code: 0, stdout: '{"viewerPermission":"WRITE"}', stderr: "" };
      if (command === "gh" && args[0] === "label" && args[1] === "list") return { code: 0, stdout: "[]", stderr: "" };
      if (command === "gh" && args[0] === "label" && args[1] === "create") {
        return options.failLabel ? { code: 1, stdout: "", stderr: "label denied" } : { code: 0, stdout: "", stderr: "" };
      }
      throw new Error(`unexpected command: ${command} ${args.join(" ")}`);
    },
    registerCommand: (name: string, command: { handler: CommandHandler }) => commands.set(name, command.handler),
    on: () => undefined,
    sendMessage: (message: { content: string }) => messages.push(message.content),
    sendUserMessage: () => undefined,
  });
  return { commands, messages };
}

function writeConfig(root: string, repoPath: string): void {
  const stateDir = path.join(root, ".pi", "agent", "deadloop");
  mkdirSync(stateDir, { recursive: true });
  writeFileSync(path.join(stateDir, "projects.json"), JSON.stringify({ projects: [{ id: "demo", repoPath, githubRepo: "owner/demo", automations: [] }] }));
}

async function invoke(handler: CommandHandler, cwd: string): Promise<void> {
  await handler("", { cwd, mode: "interactive", ui: { notify: () => undefined, setStatus: () => undefined } });
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.resetModules();
  if (originalHome === undefined) delete process.env.HOME;
  else process.env.HOME = originalHome;
  if (originalStateDir === undefined) delete process.env.PI_CODING_AGENT_DIR;
  else process.env.PI_CODING_AGENT_DIR = originalStateDir;
  if (originalPath === undefined) delete process.env.PATH;
  else process.env.PATH = originalPath;
  for (const sandbox of sandboxes.splice(0)) rmSync(sandbox, { recursive: true, force: true });
});

describe("enablement command integration", () => {
  it("records enablement after label preparation succeeds", async () => {
    const { root, repoPath } = fixtureRepository();
    writeConfig(root, repoPath);
    const extension = await loadExtension(root);

    await invoke(extension.commands.get("deadloop-enable")!, repoPath);

    expect(extension.messages.at(-1)).toContain("deadloop enabled");
  });

  it("does not record enablement when label preparation fails", async () => {
    const { root, repoPath } = fixtureRepository();
    writeConfig(root, repoPath);
    const extension = await loadExtension(root, { failLabel: true });

    await invoke(extension.commands.get("deadloop-enable")!, repoPath);

    expect(existsSync(path.join(root, ".pi", "agent", "deadloop", "enabled-projects.json"))).toBe(false);
  });

  it("rejects disable from a linked worktree without removing primary enablement", async () => {
    const { root, repoPath } = fixtureRepository();
    const linkedPath = path.join(root, "linked");
    git(repoPath, ["worktree", "add", "--quiet", "-b", "linked", linkedPath]);
    writeConfig(root, repoPath);
    const statePath = path.join(root, ".pi", "agent", "deadloop", "enabled-projects.json");
    writeFileSync(statePath, JSON.stringify({ projects: [{ repoPath, githubRepo: "owner/demo", enabledAt: 1 }] }));
    const extension = await loadExtension(root);

    await invoke(extension.commands.get("deadloop-disable")!, linkedPath);

    expect(JSON.parse(readFileSync(statePath, "utf8")).projects).toHaveLength(1);
  });

  it("reports another live lock owner as standby", async () => {
    const { root, repoPath } = fixtureRepository();
    writeConfig(root, repoPath);
    const stateDir = path.join(root, ".pi", "agent", "deadloop");
    writeFileSync(path.join(stateDir, "scheduler.demo.lock"), JSON.stringify({ pid: 4242 }));
    vi.spyOn(process, "kill").mockImplementation(((pid: number, signal?: number | string) => {
      if (pid === 4242 && signal === 0) return true;
      return true;
    }) as typeof process.kill);
    const extension = await loadExtension(root);

    await invoke(extension.commands.get("deadloop-enable")!, repoPath);

    expect(extension.messages.at(-1)).toContain("another session (pid 4242)");
  });

  it("stops an enabled primary checkout when disabled", async () => {
    const { root, repoPath } = fixtureRepository();
    writeConfig(root, repoPath);
    const extension = await loadExtension(root);
    await invoke(extension.commands.get("deadloop-enable")!, repoPath);

    await invoke(extension.commands.get("deadloop-disable")!, repoPath);

    expect(JSON.parse(readFileSync(path.join(root, ".pi", "agent", "deadloop", "enabled-projects.json"), "utf8")).projects).toHaveLength(0);
  });
});
