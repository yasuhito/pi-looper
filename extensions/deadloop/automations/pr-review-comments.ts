const { renderRepairMarker } = require("./pr-review-repair-state.ts");

type JsonObject = Record<string, any>;

const REVIEW_RESULT_RE = /<!--\s*deadloop:review-result\s+head=([0-9a-f]+)\s+review=([0-9a-f]+)\s+outcome=(approved|changes_requested|human_required)\s*-->/gi;
const REPAIR_RESULT_RE = /<!--\s*deadloop:review-repair-result\s+key=([0-9a-f]+)\s+head=([0-9a-f]+)\s*-->/gi;

function code(value: unknown): string {
  return `\`${String(value || "unknown").replace(/`/g, "")}\``;
}

function reviewMarker(input: JsonObject): string {
  return `<!-- deadloop:review-result head=${String(input.headOid).toLowerCase()} review=${String(input.reviewFingerprint).toLowerCase()} outcome=${input.outcome} -->`;
}

function renderChangesRequestedComment(input: JsonObject): string {
  const findings = (input.findings || []).map((finding: JsonObject) => {
    const location = finding.line ? `${finding.path || "Not specified"}:${finding.line}` : finding.path || "Not specified";
    return `### ${finding.title} — ${finding.severity || "unspecified"}\n- File: ${code(location)}\n- Reason: ${finding.body}`;
  });
  const marker = renderRepairMarker(input.headOid, input.reviewFingerprint);
  const nextStep = input.repairAlreadyStarted
    ? "This review result already used its one bounded automatic repair attempt. The repair will not be launched again."
    : "Exactly one bounded automatic repair will now start and will change only the findings listed above. The updated head will be reviewed again after a successful push.";
  return `## Review result: changes required

- Reviewed commit: ${code(input.headOid)}
- Conclusion: The changes below must be addressed before this PR can proceed.

${findings.join("\n\n")}

## Next step
${nextStep}

${reviewMarker({ ...input, outcome: "changes_requested" })}
${marker}`;
}

function renderApprovedReviewComment(input: JsonObject): string {
  return `## Review result: approved

- Reviewed commit: ${code(input.headOid)}
- Reason: ${input.summary || input.reason || "No actionable defects were found."}

## Next step
The reviewed head is approved. The configured handoff or merge safety checks can continue.

${reviewMarker({ ...input, outcome: "approved" })}`;
}

function renderHumanRequiredComment(input: JsonObject): string {
  return `## Review result: human decision required

- Reviewed commit: ${code(input.headOid)}
- Reason: ${input.reason || "The reviewer could not safely decide or repair this result."}
- Context: ${input.summary || "Review the findings and choose the safe next action."}

## Recovery steps
Resolve the decision above, push a new commit if code changes are needed, then remove ${code(input.blockedLabel || "agent:blocked")} so the new head can be reviewed.

${reviewMarker({ ...input, outcome: "human_required" })}`;
}

function renderRepairSuccessComment(input: JsonObject): string {
  const repairs = (input.repairs || []).map(
    (repair: JsonObject) =>
      `### ${repair.title}\n- Changed: ${repair.summary}\n- Files: ${(repair.paths || []).map(code).join(", ") || "None reported"}`,
  );
  const checks = (input.checks || []).map((check: JsonObject) => `- ${code(check.command)}: ${check.result}`);
  return `## Automatic review repair completed

- Review findings from: ${code(input.originalHeadOid)}
- New commit: ${code(input.newHeadOid)}

${repairs.join("\n\n")}

## Checks
${checks.join("\n")}

## Next step
The new head will be reviewed again. Review labels remain in place.

<!-- deadloop:review-repair-result key=${String(input.attemptKey).toLowerCase()} head=${String(input.newHeadOid).toLowerCase()} -->`;
}

function reviewCommentExists(comments: JsonObject[], headOid: string, reviewFingerprint: string, outcome: string): boolean {
  return (comments || []).some((comment) => {
    REVIEW_RESULT_RE.lastIndex = 0;
    return Array.from(String(comment?.body || "").matchAll(REVIEW_RESULT_RE)).some(
      (match) => match[1].toLowerCase() === headOid.toLowerCase() && match[2].toLowerCase() === reviewFingerprint.toLowerCase() && match[3] === outcome,
    );
  });
}

function repairResultCommentExists(comments: JsonObject[], attemptKey: string): boolean {
  return (comments || []).some((comment) => {
    REPAIR_RESULT_RE.lastIndex = 0;
    return Array.from(String(comment?.body || "").matchAll(REPAIR_RESULT_RE)).some(
      (match) => match[1].toLowerCase() === attemptKey.toLowerCase(),
    );
  });
}

module.exports = {
  renderApprovedReviewComment,
  renderChangesRequestedComment,
  renderHumanRequiredComment,
  renderRepairSuccessComment,
  repairResultCommentExists,
  reviewCommentExists,
};
