import path from "node:path";

const { normalizeEnablementStateValue } = require("./enablement-state.cjs");

export type EnabledProject = {
  repoPath: string;
  githubRepo: string;
  enabledAt: number;
  firstEnableAutoMerge?: boolean;
  lastObservedAutoMerge?: boolean;
  autoMergeAcknowledged?: boolean;
  enabled?: boolean;
};

export type EnablementState = { projects: EnabledProject[] };

export type ProjectIdentity = Pick<EnabledProject, "repoPath" | "githubRepo">;

function normalizedPath(value: string): string {
  return path.resolve(value);
}

function validIdentity(value: Partial<ProjectIdentity>): value is ProjectIdentity {
  return Boolean(value.repoPath && value.githubRepo && /^[^/\s]+\/[^/\s]+$/.test(value.githubRepo));
}

export function normalizeEnablementState(value: unknown): EnablementState | null {
  return normalizeEnablementStateValue(value) as EnablementState | null;
}

export function findEnabledProject(state: EnablementState | null, identity: ProjectIdentity): EnabledProject | null {
  if (!state || !validIdentity(identity)) return null;
  const repoPath = normalizedPath(identity.repoPath);
  return state.projects.find((project) => project.repoPath === repoPath && project.githubRepo === identity.githubRepo && project.enabled !== false) || null;
}

export function isEnabledProjectState(state: EnablementState | null, identity: ProjectIdentity): boolean {
  return findEnabledProject(state, identity) !== null;
}

export function upsertEnabledProject(
  state: EnablementState | null,
  identity: ProjectIdentity,
  now = Date.now(),
  firstEnable: Pick<EnabledProject, "firstEnableAutoMerge"> = {},
): EnablementState {
  if (!validIdentity(identity)) throw new Error("invalid project identity");
  const repoPath = normalizedPath(identity.repoPath);
  const existing = state?.projects || [];
  const previous = existing.find((project) => project.githubRepo === identity.githubRepo && project.repoPath === repoPath);
  const retained = existing.filter((project) => project.githubRepo !== identity.githubRepo && project.repoPath !== repoPath);
  return {
    projects: [
      ...retained,
      {
        ...(previous || firstEnable),
        repoPath,
        githubRepo: identity.githubRepo,
        enabledAt: now,
        ...(previous ? {} : { lastObservedAutoMerge: firstEnable.firstEnableAutoMerge }),
        enabled: true,
      },
    ],
  };
}

export function observeAutoMerge(state: EnablementState, identity: ProjectIdentity, autoMerge: boolean): EnablementState {
  if (!validIdentity(identity)) throw new Error("invalid project identity");
  const repoPath = normalizedPath(identity.repoPath);
  return {
    projects: state.projects.map((project) => {
      if (project.repoPath !== repoPath || project.githubRepo !== identity.githubRepo) return project;
      const autoMergeAcknowledged = project.autoMergeAcknowledged || (
        project.firstEnableAutoMerge === true && project.lastObservedAutoMerge === false && autoMerge === true
      );
      return { ...project, lastObservedAutoMerge: autoMerge, autoMergeAcknowledged };
    }),
  };
}

export function removeEnabledProject(state: EnablementState | null, identity: ProjectIdentity): EnablementState {
  if (!validIdentity(identity)) throw new Error("invalid project identity");
  const repoPath = normalizedPath(identity.repoPath);
  return {
    projects: (state?.projects || []).map((project) =>
      project.repoPath === repoPath && project.githubRepo === identity.githubRepo ? { ...project, enabled: false } : project,
    ),
  };
}

export function removeEnabledProjectAtPath(state: EnablementState | null, repoPath: string): EnablementState {
  const normalized = normalizedPath(repoPath);
  return {
    projects: (state?.projects || []).map((project) =>
      project.repoPath === normalized ? { ...project, enabled: false } : project,
    ),
  };
}
