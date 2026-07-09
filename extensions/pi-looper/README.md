# deadloop extension internals

This directory contains the Pi extension implementation for **deadloop**. The directory name remains `extensions/pi-looper/` for package compatibility; user-facing docs should use the `deadloop` name.

Read the root `README.md` and `docs/public-package-setup.md` for normal setup.

## Local configuration

Preferred config path:

1. `DEADLOOP_CONFIG`
2. `~/.pi/agent/deadloop/projects.json`
3. legacy `PI_LOOPER_CONFIG`
4. legacy `~/.pi/agent/pi-looper/projects.json`
5. this directory's `projects.json` for local development only

Do not commit `projects.json`; it contains local paths, GitHub repositories, and rollout choices.

Each project overlays explicit local config, trusted base-branch repo policy, and package defaults. The preferred repo policy file is `deadloop.project.json`; legacy `pi-looper.project.json` remains a fallback. Repo policy is read only from the trusted `baseBranch` after `git fetch`, never from the PR branch being reviewed.

## State

New runtime state and locks live under `~/.pi/agent/deadloop/`. Legacy config under `~/.pi/agent/pi-looper/` is still read, but new state is written under the deadloop directory.

## Commands

Preferred commands:

```text
/deadloop-status
/deadloop-doctor
```

Compatibility aliases:

```text
/pi-looper-status
/pi-looper-doctor
```

## Deterministic drivers

Each automation may define a `driverFile`. Drivers run after precheck and before any prompt is sent, with the existing `PI_LOOPER_*` environment variables for compatibility. They return JSON with `action` values `skip`, `done`, `needs_llm`, or `error`.

- `issue-coordinator-driver.ts` handles cleanup, candidate selection gates, worker launch, and bounded monitor handoff.
- `pr-reviewer-driver.ts` handles no-op, pending CI, external review gates, draft gates, reviewer launch, and bounded monitor handoff.
- `ci-fallback-decision.ts`, `worker-watch-decision.ts`, and related helpers keep deterministic checks out of prompts.

## Runner boundary

v0 uses Herdr for worktrees, tabs, and agent sessions. Herdr-specific code should remain behind runner/automation boundaries so future runners can be added without changing GitHub Issue / PR state semantics.
