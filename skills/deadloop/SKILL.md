---
name: deadloop
description: Install and operate deadloop, a Pi package/extension that loops GitHub issues through implementation, PR review, verification, and optional merge using Herdr-managed agents. Use when a user asks to install deadloop, configure issue/PR automation, or understand the npx skills add compatibility path.
---

# deadloop

deadloop is a Pi package and extension, not only an Agent Skill. Installing this skill with the Skills CLI gives an agent the setup instructions, but it does **not** by itself activate the Pi extension.

## Install path

If the user installed this skill with:

```bash
npx skills@latest add yasuhito/deadloop
```

then continue by installing the Pi package in Pi:

```bash
pi install git:github.com/yasuhito/deadloop
```

For a one-off test, use:

```bash
pi -e git:github.com/yasuhito/deadloop
```

For a local checkout:

```bash
pi install /absolute/path/to/deadloop
```

## Configure safely

1. Copy the example project config into Pi's local state directory:

   ```bash
   mkdir -p ~/.pi/agent/deadloop
   cp ~/.pi/agent/git/github.com/yasuhito/deadloop/extensions/pi-looper/projects.example.json ~/.pi/agent/deadloop/projects.json
   $EDITOR ~/.pi/agent/deadloop/projects.json
   ```

2. Keep `autoMerge: false` for first rollout.
3. Create the GitHub labels documented in `README.md` and `docs/public-package-setup.md`.
4. Start from the target repository checkout:

   ```bash
   cd /absolute/path/to/target/repo
   pi
   ```

## Rollout guidance

- Phase 1: enable only `issue-coordinator`; humans review and merge PRs.
- Phase 2: add `pr-reviewer` with `autoMerge: false`.
- Phase 3: consider `autoMerge: true` only after branch protection, CI, review expectations, and stop conditions are proven.

## Safety notes

- deadloop writes GitHub comments and labels.
- The extension and its automations run with local user permissions.
- Do not commit `extensions/pi-looper/projects.json`, `~/.pi/agent/deadloop/projects.json`, or legacy `~/.pi/agent/pi-looper/projects.json`.
- Review the package source before installing it in a repository with write access.
