# Migration to deadloop

`pi-looper` is being renamed to **deadloop**.

The rename is intentionally staged. The public product name, package name, GitHub repository name, install commands, and user-facing commands move to `deadloop`, while existing Pi automation internals keep compatibility aliases so current operators are not forced to migrate everything at once.

## What changes now

Use these names for new installs and user-facing documentation:

```bash
pi install git:github.com/yasuhito/deadloop
npx skills@latest add yasuhito/deadloop
```

Preferred local config path:

```text
~/.pi/agent/deadloop/projects.json
```

Preferred Pi commands:

```text
/deadloop-status
/deadloop-doctor
```

Preferred environment variables for operator entry points:

```bash
DEADLOOP_CONFIG=/path/to/projects.json pi
DEADLOOP_PROJECTS=my-project pi
DEADLOOP=off pi
DEADLOOP_AUTOMATIONS=off pi
DEADLOOP_DEBUG=1 pi
```

## Compatibility kept intentionally

The following identifiers remain supported for existing users:

- `PI_LOOPER_CONFIG`, `PI_LOOPER_PROJECTS`, `PI_LOOPER`, `PI_LOOPER_AUTOMATIONS`, and other `PI_LOOPER_*` automation environment variables.
- `~/.pi/agent/pi-looper/projects.json` as a fallback config path.
- `/pi-looper-status` and `/pi-looper-doctor` as command aliases.
- `pi-looper.project.json` as a trusted repo-policy fallback when `deadloop.project.json` is not present.
- The package-internal extension directory `extensions/pi-looper/`.
- Worker state directories inside worktrees such as `.pi-looper/`.
- Existing GitHub labels such as `agent:implement`, `agent:review`, and `agent:blocked`.

These compatibility names are operational API. Do not remove them until a later migration issue explicitly does so.

## Recommended migration

1. Update installation source to `git:github.com/yasuhito/deadloop`.
2. Copy local config if you want the new default path:

   ```bash
   mkdir -p ~/.pi/agent/deadloop
   cp ~/.pi/agent/pi-looper/projects.json ~/.pi/agent/deadloop/projects.json
   ```

3. Rename shared repo policy when convenient:

   ```bash
   git mv pi-looper.project.json deadloop.project.json
   ```

   Leaving `pi-looper.project.json` in place still works during the compatibility period.

4. Prefer `/deadloop-status` and `/deadloop-doctor` in runbooks. Existing `/pi-looper-*` commands still work.

## What is not changing in this migration

- The v0 runner is still Herdr.
- The Pi package still lives under `extensions/pi-looper/` internally.
- Automation scripts still receive `PI_LOOPER_*` environment variables.
- The safety model, auto-merge gates, labels, and promise-file contract are unchanged.
