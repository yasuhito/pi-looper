import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { After, Given, Then, When } from "@cucumber/cucumber";

const {
  finalizeBranchUpdate,
} = require("../../extensions/deadloop/automations/pr-branch-update-finalize.ts");
const {
  decideBranchUpdateLive,
} = require("../../extensions/deadloop/automations/pr-branch-update-decision.ts");

const head = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
const base = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";
const branch = "agent/issue-31";

type SafetyWorld = {
  actualHead?: string;
  baseRef?: string;
  branchUpdateOperations?: string[];
  branchUpdateRoot?: string;
  changeHeadAfterChecks?: boolean;
  crossRepository?: boolean;
  commands?: string[][];
  dirtyWorktree?: boolean;
  finalizeResult?: Record<string, unknown>;
  headRef?: string;
  temporaryRoots?: string[];
  trustLaunchMarker?: string;
  trustRoot?: string;
};

function finalize(world: SafetyWorld): void {
  const commands: string[][] = [];
  world.commands = commands;
  try {
    world.finalizeResult = finalizeBranchUpdate(
      {
        repo: "/worktree",
        githubRepo: "owner/repo",
        pr: "31",
        branch,
        expectedHead: head,
        expectedBase: base,
        remote: "origin",
        automationDir: "/automation",
        stateDir: "/state",
        checkCommand: "npm test",
      },
      {
        run: (args: string[]) => {
          commands.push(args);
          if (args[0] === "node" && args[1]?.endsWith("/run-project-check.ts") && world.changeHeadAfterChecks) {
            world.actualHead = base;
          }
          if (args[0] === "gh") {
            return {
              status: 0,
              stdout: JSON.stringify({
                state: "OPEN",
                isCrossRepository: world.crossRepository ?? false,
                headRefName: branch,
                headRefOid: world.actualHead ?? head,
              }),
              stderr: "",
            };
          }
          if (args.includes("status") && args.includes("--porcelain")) {
            return { status: 0, stdout: world.dirtyWorktree ? " M tracked-file\n" : "", stderr: "" };
          }
          if (args.at(-1) === "HEAD" && args.includes("rev-parse")) {
            return { status: 0, stdout: "cccccccccccccccccccccccccccccccccccccccc\n", stderr: "" };
          }
          return { status: 0, stdout: "", stderr: "" };
        },
      },
    );
  } catch (error) {
    if (!world.dirtyWorktree) throw error;
  }
}

function pushCommands(world: SafetyWorld): string[][] {
  return (world.commands ?? []).filter((command) => command[0] === "git" && command.includes("push"));
}

function pushedRefs(world: SafetyWorld): string[] {
  return pushCommands(world).flatMap((command) =>
    command
      .slice(command.indexOf("origin") + 1)
      .filter((argument) => !argument.startsWith("-"))
      .map((argument) => argument.replace(/^\+/, "")),
  );
}

function forcePushOptions(world: SafetyWorld): string[] {
  return pushCommands(world).flatMap((command) =>
    command.filter(
      (argument) => argument === "-f" || argument === "--mirror" || argument.startsWith("--force") || argument.startsWith("+"),
    ),
  );
}

function temporaryRoot(world: SafetyWorld, prefix: string): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  world.temporaryRoots = [...(world.temporaryRoots ?? []), root];
  return root;
}

Given("更新前に確認した pull request head がある", function (this: SafetyWorld) {
  this.actualHead = head;
  this.crossRepository = false;
});

Given("自動チェック後に pull request head が変わる", function (this: SafetyWorld) {
  this.changeHeadAfterChecks = true;
});

Given("更新対象の作業場所に未コミットの変更がある", function (this: SafetyWorld) {
  const root = temporaryRoot(this, "deadloop-dirty-branch-update-");
  const runGit = (args: string[]): string => {
    const result = spawnSync("git", ["-C", root, ...args], { encoding: "utf8" });
    if (result.status !== 0) throw new Error(result.stderr || result.stdout || `git failed: ${args.join(" ")}`);
    return result.stdout.trim();
  };
  runGit(["init", "--quiet"]);
  runGit(["config", "user.name", "Deadloop Acceptance"]);
  runGit(["config", "user.email", "acceptance@example.invalid"]);
  fs.writeFileSync(path.join(root, "tracked-file"), "pull request head\n");
  runGit(["add", "tracked-file"]);
  runGit(["commit", "--quiet", "-m", "pull request head"]);
  this.headRef = runGit(["rev-parse", "HEAD"]);
  fs.writeFileSync(path.join(root, "tracked-file"), "selected base head\n");
  runGit(["commit", "--quiet", "-am", "selected base head"]);
  this.baseRef = runGit(["rev-parse", "HEAD"]);
  runGit(["checkout", "--quiet", "--detach", this.headRef]);
  fs.writeFileSync(path.join(root, "tracked-file"), "uncommitted change\n");
  this.branchUpdateRoot = root;
  this.dirtyWorktree = true;
});

Given("pull request が別リポジトリから作られている", function (this: SafetyWorld) {
  this.crossRepository = true;
});

When("deadloop が branch 更新を完了しようとする", function (this: SafetyWorld) {
  if (this.dirtyWorktree) {
    if (!this.branchUpdateRoot || !this.headRef || !this.baseRef) throw new Error("dirty worktree precondition is missing");
    const decision = decideBranchUpdateLive(this.branchUpdateRoot, this.headRef, this.baseRef, this.headRef);
    this.branchUpdateOperations = [decision.action];
    return;
  }
  finalize(this);
});

Then("branch への push は行われない", function (this: SafetyWorld) {
  assert.deepEqual(pushCommands(this), []);
});

Then("branch 更新処理は開始されない", function (this: SafetyWorld) {
  assert.deepEqual(this.branchUpdateOperations, ["blocked"]);
});

Then("完了結果は古い head として観測される", function (this: SafetyWorld) {
  assert.equal(this.finalizeResult?.action, "stale_head");
});

Given("作業場所の信頼が承認されていない", function (this: SafetyWorld) {
  this.trustRoot = temporaryRoot(this, "deadloop-untrusted-");
  const binDir = path.join(this.trustRoot, "bin");
  this.trustLaunchMarker = path.join(this.trustRoot, "herdr-started");
  fs.mkdirSync(binDir);
  fs.writeFileSync(path.join(this.trustRoot, ".claude.json"), '{"projects":{}}\n');
  fs.writeFileSync(path.join(this.trustRoot, "prompt.md"), "Implement the issue.\n");
  fs.writeFileSync(
    path.join(binDir, "herdr"),
    `#!/usr/bin/env node\nrequire("node:fs").writeFileSync(${JSON.stringify(this.trustLaunchMarker)}, "started");\n`,
    { mode: 0o755 },
  );
});

When("deadloop が Claude の作業エージェントを起動しようとする", function (this: SafetyWorld) {
  if (!this.trustRoot) throw new Error("trust precondition is missing");
  spawnSync(
    "node",
    [
      "extensions/deadloop/automations/launch-agent.ts",
      "--agent",
      "claude",
      "--name",
      "agent-issue-31",
      "--cwd",
      this.trustRoot,
      "--repo-path",
      this.trustRoot,
      "--level",
      "low",
      "--prompt-file",
      path.join(this.trustRoot, "prompt.md"),
      "--uuid",
      "branch-update-safety",
    ],
    {
      cwd: process.cwd(),
      encoding: "utf8",
      env: { ...process.env, HOME: this.trustRoot, PATH: `${path.join(this.trustRoot, "bin")}:${process.env.PATH}` },
    },
  );
});

Then("作業エージェントは起動されない", function (this: SafetyWorld) {
  assert.equal(fs.existsSync(this.trustLaunchMarker ?? ""), false);
});

Then("選択された branch だけが push の対象になる", function (this: SafetyWorld) {
  assert.deepEqual(pushedRefs(this), [`HEAD:refs/heads/${branch}`]);
});

Then("branch は強制せずに push される", function (this: SafetyWorld) {
  assert.deepEqual(forcePushOptions(this), []);
});

After(function (this: SafetyWorld) {
  for (const root of this.temporaryRoots ?? []) fs.rmSync(root, { recursive: true, force: true });
});
