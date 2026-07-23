import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { normalizeProject } from "../src/core";
import { resolveActiveProject } from "../src/status";

const fixture = JSON.parse(readFileSync("test/fixtures/status/report-case.json", "utf8"));
const projects = fixture.projects.map(normalizeProject);


describe("deadloop status report", () => {
  it("resolves the active project from the configured repository path", () => {
    expect(resolveActiveProject("/home/yasuhito/Work/deadloop/docs", projects)?.id).toBe("deadloop");
  });

});
