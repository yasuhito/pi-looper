import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const extensionCode = readFileSync("extensions/pi-looper/index.ts", "utf8");
const migrationDoc = readFileSync("docs/migration-to-deadloop.md", "utf8");

describe("deadloop migration boundary", () => {
  it("registers the deadloop status command", () => {
    expect(extensionCode).toContain('"deadloop-status"');
  });

  it("keeps the pi-looper status command as a compatibility alias", () => {
    expect(extensionCode).toContain('"pi-looper-status"');
  });

  it("documents compatibility identifiers that intentionally remain legacy", () => {
    expect(migrationDoc).toContain("`PI_LOOPER_*`");
  });

  it("documents the preferred deadloop config path", () => {
    expect(migrationDoc).toContain("~/.pi/agent/deadloop/projects.json");
  });
});
