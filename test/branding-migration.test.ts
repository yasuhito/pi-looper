import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const extensionCode = readFileSync("extensions/deadloop/index.ts", "utf8");
const migrationDoc = readFileSync("docs/migration-to-deadloop.md", "utf8");

describe("deadloop rename boundary", () => {
  it("registers the deadloop status command", () => {
    expect(extensionCode).toContain('"deadloop-status"');
  });

  it("does not register old pi-looper command aliases", () => {
    expect(extensionCode).not.toContain("pi-looper-status");
  });

  it("does not read old PI_LOOPER environment variables", () => {
    expect(extensionCode).not.toContain("PI_LOOPER");
  });

  it("documents the breaking rename", () => {
    expect(migrationDoc).toContain("breaking cleanup");
  });
});
