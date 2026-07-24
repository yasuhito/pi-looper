import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import path from "node:path";

import { Given, Then, When } from "@cucumber/cucumber";

type IssueCoordinationResult = {
  action?: string;
  comment?: string;
  launch?: { simulated?: boolean };
  monitorHandoff?: { kind?: string };
};

type IssueCoordinationWorld = {
  fixtureName?: string;
  result?: IssueCoordinationResult;
};

const driverScript = "extensions/deadloop/automations/issue-coordinator-driver.ts";

function coordinateIssue(fixtureName: string): IssueCoordinationResult {
  const result = spawnSync(
    "node",
    [driverScript, "--fixture", path.join("test/fixtures/issue-coordinator", fixtureName)],
    {
      cwd: process.cwd(),
      encoding: "utf8",
      env: {
        ...process.env,
        DEADLOOP_PROJECT_ID: "acceptance",
        DEADLOOP_REPO_PATH: "/example/repository",
        DEADLOOP_GITHUB_REPO: "owner/repository",
        DEADLOOP_CHECK_COMMAND: "npm run check",
        DEADLOOP_WORKER_AGENT: "pi",
      },
    },
  );
  if (result.status !== 0) throw new Error(result.stderr || result.stdout);
  return JSON.parse(result.stdout);
}

Given("選ばれた Issue に必要な実装契約がそろっていない", function (this: IssueCoordinationWorld) {
  this.fixtureName = "driver-contract-missing.json";
});

Given("選ばれた Issue が計画をまとめるためのものである", function (this: IssueCoordinationWorld) {
  this.fixtureName = "driver-blocked-prd.json";
});

Given("選ばれた実装可能な Issue が設計文書を参照している", function (this: IssueCoordinationWorld) {
  this.fixtureName = "driver-prd-doc-reference.json";
});

Given("選ばれた Issue に実装契約がそろっている", function (this: IssueCoordinationWorld) {
  this.fixtureName = "driver-ready-worker.json";
});

When("deadloop が選ばれた Issue の次処理を決める", function (this: IssueCoordinationWorld) {
  if (!this.fixtureName) throw new Error("issue precondition is missing");
  this.result = coordinateIssue(this.fixtureName);
});

Then("その Issue の作業は開始されない", function (this: IssueCoordinationWorld) {
  assert.equal(this.result?.launch, undefined);
});

Then("不足している契約項目と再投入方法が案内される", function (this: IssueCoordinationWorld) {
  assert.equal(
    this.result?.comment,
    [
      "deadloop skipped automated implementation because the issue is missing an implementation contract.",
      "",
      "Missing:",
      "- `## Agent Brief` or `## What to build`",
      "- `## Acceptance criteria`",
      "",
      "Update the issue body, then add `agent:implement` again. Target: #10",
    ].join("\n"),
  );
});

Then("実装可能な Issue への分割方法が案内される", function (this: IssueCoordinationWorld) {
  assert.match(
    this.result?.comment || "",
    /Skipped automated implementation because this looks like a PRD, design, or parent issue\.[\s\S]*Create a separate implementable issue or split this issue's scope\./,
  );
});

Then("その Issue の作業が開始される", function (this: IssueCoordinationWorld) {
  assert.equal(this.result?.launch?.simulated, true);
});

Then("その Issue は作業開始後の完了監視へ進む", function (this: IssueCoordinationWorld) {
  assert.deepEqual(
    { workStarted: this.result?.launch?.simulated, monitoringTarget: this.result?.monitorHandoff?.kind },
    { workStarted: true, monitoringTarget: "issue" },
  );
});
