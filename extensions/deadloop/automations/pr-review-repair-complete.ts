#!/usr/bin/env node
// Convert one repair promise plus the finalizer receipt into an idempotent
// public result. This handler never pushes or launches work.

const fs = require("node:fs") as typeof import("node:fs");
const { validatePromise } = require("./extract-worker-promise.ts");
const { renderRepairSuccessComment, repairResultCommentExists } = require("./pr-review-comments.ts");
const { createCommandRunner, driverResult } = require("../../../src/automation-driver-kit.ts");
const { createGithubOperations } = require("../../../src/github-operations.ts");

import type { DriverResult, JsonObject } from "../../../src/automation-driver-kit";

function parseArgs(argv: string[]): JsonObject {
  const values: JsonObject = {};
  for (let index = 0; index < argv.length; index += 2) {
    const flag = argv[index];
    const value = argv[index + 1];
    if (!flag?.startsWith("--") || value === undefined) throw new Error("expected flag/value pairs");
    values[flag.slice(2).replace(/-([a-z])/g, (_match, char) => char.toUpperCase())] = value;
  }
  for (const name of ["promise", "result", "githubRepo", "pr", "expectedHead", "attemptKey", "reviewingLabel", "blockedLabel"]) {
    if (!values[name]) throw new Error(`--${name.replace(/[A-Z]/g, (char) => `-${char.toLowerCase()}`)} is required`);
  }
  return values;
}

function recoveryComment(args: JsonObject, reason: string, summary: string): string {
  return `## Automatic review repair stopped

- Review findings from: \`${String(args.expectedHead).toLowerCase()}\`
- Reason: ${reason}
- Detail: ${summary || "The bounded repair could not safely complete."}

## Recovery steps
Inspect the current PR head and checks, correct the branch without rewriting published history, push a new commit, then remove \`${args.blockedLabel}\` so review can resume.

<!-- deadloop:review-repair-stop key=${String(args.attemptKey).toLowerCase()} -->`;
}

function completion(args: JsonObject): DriverResult {
  const runner = createCommandRunner();
  const github = createGithubOperations(runner);
  const validation = validatePromise(String(args.promise));
  const receipt = fs.existsSync(String(args.result)) ? JSON.parse(fs.readFileSync(String(args.result), "utf8")) : null;
  const pr = runner.runJson([
    "gh",
    "pr",
    "view",
    String(args.pr),
    "-R",
    String(args.githubRepo),
    "--json",
    "state,headRefOid,comments",
  ]);
  const comments = (pr.comments || []) as JsonObject[];
  const stopMarker = `<!-- deadloop:review-repair-stop key=${String(args.attemptKey).toLowerCase()} -->`;

  if (validation.status === "complete" && validation.promise?.reason === "stale_head") {
    return driverResult("done", `PR #${args.pr} repair became stale; no public success was posted`, { driverAction: "repair_stale_head" });
  }

  const successful =
    validation.status === "complete" &&
    validation.promise?.reason === "repair_pushed" &&
    receipt?.action === "pushed" &&
    String(receipt.originalHeadOid || "").toLowerCase() === String(args.expectedHead).toLowerCase() &&
    String(receipt.headOid || "").toLowerCase() === String(pr.headRefOid || "").toLowerCase() &&
    JSON.stringify(validation.promise.checks) === JSON.stringify(receipt.checks);

  if (successful) {
    if (repairResultCommentExists(comments, String(args.attemptKey))) {
      return driverResult("done", `PR #${args.pr} repair result was already posted`, { driverAction: "repair_result_duplicate" });
    }
    const comment = renderRepairSuccessComment({
      attemptKey: args.attemptKey,
      originalHeadOid: args.expectedHead,
      newHeadOid: receipt.headOid,
      repairs: validation.promise.repairs,
      checks: receipt.checks,
    });
    github.commentPr(String(args.githubRepo), String(args.pr), comment);
    return driverResult("done", `PR #${args.pr} repair result posted`, { driverAction: "repair_result_posted", comment });
  }

  if (comments.some((comment) => String(comment?.body || "").includes(stopMarker))) {
    return driverResult("done", `PR #${args.pr} repair stop was already posted`, { driverAction: "repair_stop_duplicate" });
  }
  const reason = validation.promise?.reason || validation.error || receipt?.reason || "inconclusive_repair_completion";
  const summary = validation.promise?.summary || "The finalizer receipt and structured repair report did not confirm the same successful push.";
  const comment = recoveryComment(args, reason, summary);
  github.commentPr(String(args.githubRepo), String(args.pr), comment);
  github.movePrLabels(String(args.githubRepo), String(args.pr), { remove: String(args.reviewingLabel), add: String(args.blockedLabel) });
  return driverResult("done", `PR #${args.pr} repair requires human recovery`, { driverAction: "repair_human_blocked", comment });
}

function main(): void {
  try {
    process.stdout.write(`${JSON.stringify(completion(parseArgs(process.argv.slice(2))))}\n`);
  } catch (error) {
    process.stdout.write(
      `${JSON.stringify(driverResult("error", error instanceof Error ? error.message : String(error), { driverAction: "exception" }))}\n`,
    );
  }
}

if (require.main === module) main();

module.exports = { completion, parseArgs, recoveryComment };
