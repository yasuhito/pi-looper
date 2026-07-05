import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const oldIssueStem = ["generic", "issue-coordinator"].join("-");
const oldReviewStem = ["generic", "pr-reviewer"].join("-");

function exampleAutomationFiles(index: number) {
  const config = JSON.parse(readFileSync("extensions/pi-looper/projects.example.json", "utf8"));
  const automation = config.projects[0].automations[index] as { promptFile: string; precheckFile: string };
  return { promptFile: automation.promptFile, precheckFile: automation.precheckFile };
}

function trackedContent() {
  return execFileSync("git", ["ls-files"], { encoding: "utf8" })
    .trim()
    .split("\n")
    .filter((file) => file.length > 0)
    .filter((file) => !file.endsWith(".png"))
    .map((file) => readFileSync(file, "utf8"))
    .join("\n");
}

describe("automation short names", () => {
  it("uses short issue coordinator files in the example project config", () => {
    expect(exampleAutomationFiles(0)).toEqual({
      promptFile: "issue-coordinator.prompt.md",
      precheckFile: "issue-coordinator.precheck.sh",
    });
  });

  it("uses short PR reviewer files in the example project config", () => {
    expect(exampleAutomationFiles(1)).toEqual({
      promptFile: "pr-reviewer.prompt.md",
      precheckFile: "pr-reviewer.precheck.sh",
    });
  });

  it("does not ship old automation filenames", () => {
    expect(readdirSync("extensions/pi-looper/automations").some((file) => file.startsWith("generic-"))).toBe(false);
  });

  it("does not keep the old issue coordinator stem in tracked files", () => {
    expect(trackedContent()).not.toContain(oldIssueStem);
  });

  it("does not keep the old PR reviewer stem in tracked files", () => {
    expect(trackedContent()).not.toContain(oldReviewStem);
  });
});
