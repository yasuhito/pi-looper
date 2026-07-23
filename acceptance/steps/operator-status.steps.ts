import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { Given, Then, When } from "@cucumber/cucumber";

import { EXTENSION_CODE_CHANGED_WARNING, normalizeProject } from "../../src/core";
import { buildStatusSnapshot, formatStatusReport } from "../../src/status";

const { renderIssueBlockedComment } = require("../../src/issue-coordinator-renderers.ts");

const fixture = JSON.parse(readFileSync("test/fixtures/status/report-case.json", "utf8"));
const projects = fixture.projects.map(normalizeProject);
const prReviewerPrompt = readFileSync("extensions/deadloop/automations/pr-reviewer.prompt.md", "utf8");

type OperatorStatusWorld = {
  report?: string;
  blockedComment?: string;
  commands?: string[];
};

function statusReport(warnings: string[] = []): string {
  return formatStatusReport(buildStatusSnapshot({ ...fixture, projects, warnings }));
}

function issueBlockedComment(): string {
  return renderIssueBlockedComment({
    issueNumber: 1,
    githubRepo: "owner/repo",
    repoPath: "/repo",
    automationDir: "/auto",
    blockedLabel: "agent:blocked",
    implementLabel: "agent:implement",
    summary: "blocked",
  });
}

Given("deadloop の状態表示用データがある", function (this: OperatorStatusWorld) {
  this.report = statusReport();
});

Given("コード更新の警告がある deadloop の状態表示用データがある", function (this: OperatorStatusWorld) {
  this.report = statusReport([EXTENSION_CODE_CHANGED_WARNING]);
});

When("オペレーターが deadloop の状態を表示する", function () {});

Then("実装待ちの Issue はないと表示される", function (this: OperatorStatusWorld) {
  assert.match(this.report || "", /- eligible: none/);
});

Then("レビュー対象の pull request が表示される", function (this: OperatorStatusWorld) {
  assert.match(this.report || "", /- review target: #21 Add status report/);
});

Then("片付け候補の作業場所が表示される", function (this: OperatorStatusWorld) {
  assert.match(this.report || "", /#20 agent\/issue-12-old -> .*\(workspace-20; merged_pr\)/);
});

Then("稼働中の作業場所が表示される", function (this: OperatorStatusWorld) {
  assert.match(this.report || "", /agent\/issue-13-add-deadloop-status-report -> .*\(workspace-13\)/);
});

Then("コード更新の警告が表示される", function (this: OperatorStatusWorld) {
  assert.match(this.report || "", new RegExp(EXTENSION_CODE_CHANGED_WARNING));
});

Then("自動化の直近の判断が表示される", function (this: OperatorStatusWorld) {
  assert.match(this.report || "", /summary=driver selected Issue #12/);
});

Then("設定元が表示される", function (this: OperatorStatusWorld) {
  assert.match(this.report || "", /config: local=unknown local projects\.json; repoPolicy=origin\/main:deadloop\.json \(not-read\)/);
});

Given("停止した Issue がある", function (this: OperatorStatusWorld) {
  this.blockedComment = issueBlockedComment();
});

When("deadloop が停止コメントを作成する", function () {});

Then("停止コメントに復旧手順が表示される", function (this: OperatorStatusWorld) {
  assert.match(this.blockedComment || "", /## Recovery steps/);
});

Then("停止コメントに安全な再投入方法が表示される", function (this: OperatorStatusWorld) {
  assert.match(this.blockedComment || "", /gh issue edit 1 -R owner\/repo --remove-label agent:blocked --add-label agent:implement/);
});

Given("停止した pull request がある", function (this: OperatorStatusWorld) {
  this.blockedComment = prReviewerPrompt;
});

Then("pull request の停止コメントに復旧手順が表示される", function (this: OperatorStatusWorld) {
  assert.match(this.blockedComment || "", /## Recovery steps/);
});

Then("pull request の停止コメントに安全な再投入方法が表示される", function (this: OperatorStatusWorld) {
  assert.match(this.blockedComment || "", /gh issue edit <issueNumber> -R \{\{githubRepo\}\} --remove-label "\{\{blockedLabel\}\}" --add-label "\{\{implementLabel\}\}"/);
});

Given("deadloop 拡張を起動できる", function (this: OperatorStatusWorld) {
  this.commands = [];
});

When("deadloop 拡張が公開コマンドを登録する", function (this: OperatorStatusWorld) {
  const extension = require("../../extensions/deadloop/index.ts").default;
  extension({
    registerCommand: (name: string) => this.commands?.push(name),
    on: () => {},
  });
});

Then("`\\/deadloop-status` が利用できる", function (this: OperatorStatusWorld) {
  assert.ok(this.commands?.includes("deadloop-status"));
});
