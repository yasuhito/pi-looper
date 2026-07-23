import path from "node:path";
import { describe, expect, it } from "vitest";

import { inferredProjectId, schedulerLockName } from "../src/project-identity";

describe("canonical project identity", () => {
  const first = { id: "app", repoPath: path.join("/a", "app"), githubRepo: "owner/first" };
  const second = { id: "app", repoPath: path.join("/b", "app"), githubRepo: "owner/second" };

  it("uses different scheduler locks for repositories with the same basename", () => {
    expect(schedulerLockName(first)).not.toBe(schedulerLockName(second));
  });

  it("uses the same scheduler lock when only the explicit project id changes", () => {
    expect(schedulerLockName(first)).toBe(schedulerLockName({ ...first, id: "renamed" }));
  });

  it("uses different inferred worktree directory ids for repositories with the same basename", () => {
    expect(inferredProjectId(first.repoPath, first.githubRepo)).not.toBe(inferredProjectId(second.repoPath, second.githubRepo));
  });
});
