import assert from "node:assert/strict";

import { Given, Then, When } from "@cucumber/cucumber";

import { normalizeProject, parseProjectsConfig, resolveConfigPath, type NormalizedProject } from "../../src/core";

type ConfigurationWorld = {
  configPath?: string;
  configOptions?: Parameters<typeof resolveConfigPath>[0];
  raw?: Record<string, unknown>;
  policy?: Record<string, unknown>;
  project?: NormalizedProject;
};

const paths = {
  environment: "/environment/projects.json",
  user: "/state/projects.json",
  extension: "/extension/projects.json",
};

function resolve(world: ConfigurationWorld, raw: Record<string, unknown> = {}, policy?: Record<string, unknown>): void {
  const result = policy
    ? parseProjectsConfig(JSON.stringify({ projects: [{ id: "demo", ...raw }] }), "", {
        repoPolicyProvider: () => ({ status: "loaded", text: JSON.stringify(policy) }),
      })
    : { ok: true as const, projects: [normalizeProject({ id: "demo", ...raw })] };
  if (!result.ok && "reason" in result) throw new Error(result.reason);
  world.project = result.projects[0];
}

Given("三つの設定ファイルがある", function (this: ConfigurationWorld) {});

Given("`DEADLOOP_CONFIG` で設定ファイルを指定する", function (this: ConfigurationWorld) {
  this.configOptions = { env: { DEADLOOP_CONFIG: paths.environment }, stateDir: "/state", extensionDir: "/extension", exists: () => true };
});

Given("`DEADLOOP_CONFIG` を指定しない", function (this: ConfigurationWorld) {
  this.configOptions = { env: {}, stateDir: "/state", extensionDir: "/extension", exists: (file) => file === paths.user };
});

Given("同梱設定ファイルだけがある", function (this: ConfigurationWorld) {
  this.configOptions = { env: {}, stateDir: "/state", extensionDir: "/extension", exists: () => false };
});

When("deadloop が設定ファイルを探す", function (this: ConfigurationWorld) {
  if (!this.configOptions) throw new Error("configuration file precondition is missing");
  this.configPath = resolveConfigPath(this.configOptions);
});

Then("指定した設定ファイルが選ばれる", function (this: ConfigurationWorld) {
  assert.equal(this.configPath, paths.environment);
});

Then("利用者設定ファイルが選ばれる", function (this: ConfigurationWorld) {
  assert.equal(this.configPath, paths.user);
});

Then("同梱設定ファイルが選ばれる", function (this: ConfigurationWorld) {
  assert.equal(this.configPath, paths.extension);
});

Given("空のプロジェクト設定がある", function (this: ConfigurationWorld) {
  this.raw = {};
});

Given("空の自動化設定がある", function (this: ConfigurationWorld) {
  this.raw = { automations: [] };
});

Given("Worker に claude を指定したプロジェクト設定がある", function (this: ConfigurationWorld) {
  this.raw = { workerAgent: "claude" };
});

Given("Reviewer に claude を指定したプロジェクト設定がある", function (this: ConfigurationWorld) {
  this.raw = { reviewerAgent: "claude" };
});

Given("Worker モデルを指定したプロジェクト設定がある", function (this: ConfigurationWorld) {
  this.raw = { workerModel: "anthropic/claude-opus-4-8" };
});

Given("Reviewer モデルを指定したプロジェクト設定がある", function (this: ConfigurationWorld) {
  this.raw = { reviewerModel: "openai-codex/gpt-5.2-codex" };
});

Given("Worker モデルを含む共有方針と空のローカル設定がある", function (this: ConfigurationWorld) {
  this.raw = {};
  this.policy = { workerModel: "shared-model" };
});

Given("異なる Worker モデルを含む共有方針とローカル設定がある", function (this: ConfigurationWorld) {
  this.raw = { workerModel: "local-model" };
  this.policy = { workerModel: "shared-model" };
});

Given("指示ファイルを含む共有方針と空のローカル設定がある", function (this: ConfigurationWorld) {
  this.raw = {};
  this.policy = { workerInstructionFiles: ["docs/agents.md"] };
});

Given("自動マージを有効にしたプロジェクト設定がある", function (this: ConfigurationWorld) {
  this.raw = { autoMerge: true };
});

When("deadloop がプロジェクト設定を解決する", function (this: ConfigurationWorld) {
  resolve(this, this.raw, this.policy);
});

Then("標準の自動化が有効になる", function (this: ConfigurationWorld) {
  assert.deepEqual(this.project?.automations.map((automation) => automation.id), ["demo:issue-coordinator", "demo:pr-reviewer"]);
});

Then("有効な自動化はない", function (this: ConfigurationWorld) {
  assert.deepEqual(this.project?.automations, []);
});

Then("Worker は pi を使う", function (this: ConfigurationWorld) {
  assert.equal(this.project?.workerAgent, "pi");
});

Then("Reviewer は pi を使う", function (this: ConfigurationWorld) {
  assert.equal(this.project?.reviewerAgent, "pi");
});

Then("Worker は claude を使う", function (this: ConfigurationWorld) {
  assert.equal(this.project?.workerAgent, "claude");
});

Then("Reviewer は claude を使う", function (this: ConfigurationWorld) {
  assert.equal(this.project?.reviewerAgent, "claude");
});

Then("指定した Worker モデルが使われる", function (this: ConfigurationWorld) {
  assert.equal(this.project?.workerModel, "anthropic/claude-opus-4-8");
});

Then("指定した Reviewer モデルが使われる", function (this: ConfigurationWorld) {
  assert.equal(this.project?.reviewerModel, "openai-codex/gpt-5.2-codex");
});

Then("共有方針の Worker モデルが使われる", function (this: ConfigurationWorld) {
  assert.equal(this.project?.workerModel, "shared-model");
});

Then("ローカルの Worker モデルが使われる", function (this: ConfigurationWorld) {
  assert.equal(this.project?.workerModel, "local-model");
});

Then("共有方針の指示ファイルが使われる", function (this: ConfigurationWorld) {
  assert.equal(this.project?.workerInstructions, "Start by reading docs/agents.md, and docs relevant to the change. Follow repository-local instructions first.");
});

Then("自動マージは有効である", function (this: ConfigurationWorld) {
  assert.equal(this.project?.autoMerge, true);
});

Then("自動マージは無効である", function (this: ConfigurationWorld) {
  assert.equal(this.project?.autoMerge, false);
});

Then("CI 代替は無効である", function (this: ConfigurationWorld) {
  assert.deepEqual(this.project?.ciFallback, { enabled: false, mode: "billing-only", allowAutoMerge: false, localCommands: "" });
});

Then("外部レビューは無効である", function (this: ConfigurationWorld) {
  assert.equal(this.project?.externalReview.enabled, false);
});
