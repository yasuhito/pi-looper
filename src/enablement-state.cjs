const path = require("node:path");

function validIdentity(value) {
  return Boolean(value && typeof value.repoPath === "string" && value.repoPath && typeof value.githubRepo === "string" && /^[^/\s]+\/[^/\s]+$/.test(value.githubRepo));
}

function normalizeEnablementStateValue(value) {
  if (!value || typeof value !== "object" || Array.isArray(value) || !Array.isArray(value.projects)) return null;
  const normalized = [];
  for (const candidate of value.projects) {
    if (!candidate || typeof candidate !== "object" || Array.isArray(candidate) || !validIdentity(candidate) || !Number.isFinite(candidate.enabledAt)) return null;
    for (const field of ["firstEnableAutoMerge", "lastObservedAutoMerge", "autoMergeAcknowledged", "enabled"]) {
      if (candidate[field] !== undefined && typeof candidate[field] !== "boolean") return null;
    }
    normalized.push({
      repoPath: path.resolve(candidate.repoPath),
      githubRepo: candidate.githubRepo,
      enabledAt: Number(candidate.enabledAt),
      ...(candidate.firstEnableAutoMerge === undefined ? {} : { firstEnableAutoMerge: candidate.firstEnableAutoMerge }),
      ...(candidate.lastObservedAutoMerge === undefined ? {} : { lastObservedAutoMerge: candidate.lastObservedAutoMerge }),
      ...(candidate.autoMergeAcknowledged === undefined ? {} : { autoMergeAcknowledged: candidate.autoMergeAcknowledged }),
      ...(candidate.enabled === undefined ? {} : { enabled: candidate.enabled }),
    });
  }
  return { projects: normalized };
}

module.exports = { normalizeEnablementStateValue, validIdentity };
