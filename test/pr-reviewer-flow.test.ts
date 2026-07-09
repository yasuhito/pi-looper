import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const { planPrReviewerAction } = require("../extensions/deadloop/automations/pr-reviewer-flow.ts");

const fixtureDir = path.join(process.cwd(), "test/fixtures/pr-reviewer-driver");

function fixture(name: string) {
  return JSON.parse(fs.readFileSync(path.join(fixtureDir, name), "utf8"));
}

function env(overrides: Record<string, unknown> = {}) {
  return {
    projectId: "demo",
    reviewLabel: "agent:review",
    reviewingLabel: "agent:reviewing",
    humanLabel: "ready-for-human",
    blockedLabel: "agent:blocked",
    autoMerge: false,
    externalReviewWaitSeconds: "1800",
    now: "2026-07-08T00:00:00Z",
    ...overrides,
  };
}

describe("PR reviewer use-case flow", () => {
  it("plans no-candidate when no PR is selectable", () => {
    const data = fixture("no-candidate.json");

    expect(planPrReviewerAction(data.prs, data.agents, env()).kind).toBe("skip_no_candidate");
  });

  it("plans waiting when checks are pending", () => {
    const data = fixture("pending-ci.json");

    expect(planPrReviewerAction(data.prs, data.agents, env()).kind).toBe("skip_wait");
  });

  it("plans draft gate before review launch", () => {
    const data = fixture("draft-pr.json");

    expect(planPrReviewerAction(data.prs, data.agents, env()).kind).toBe("draft_gate");
  });

  it("plans external review request before reviewer launch", () => {
    const data = fixture("external-review-request.json");

    expect(planPrReviewerAction(data.prs, data.agents, env()).kind).toBe("external_review_request");
  });

  it("plans reviewer launch after stale external review", () => {
    const data = fixture("fallback-review.json");

    expect(planPrReviewerAction(data.prs, data.agents, env()).kind).toBe("review_required");
  });
});
