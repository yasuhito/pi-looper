# Automation driver result acceptance verification

This note records the Cucumber migration for the observable automation-driver outcomes in Issue #120. The existing deterministic runner remains unchanged; only its public prompt-delivery behavior moved from Vitest to the executable acceptance specification.

## Classification correspondence and equivalence

| Classification ID | Acceptance scenario | Observable guarantee |
| --- | --- | --- |
| T030 | `処理不要と判断された場合はプロンプトを送信しない` | A no-work decision sends no prompt. |
| T032 | `処理完了と報告された場合はプロンプトを送信しない` | A completed decision sends no prompt. |
| T034 | `判断が必要な場合は判断用プロンプトだけを送信する` | A decision-needed result sends exactly its decision prompt. |
| T037 | `自動化の応答が不正な場合はプロンプトを送信しない` | Invalid driver output fails closed without a prompt. |
| T039 | `自動化が失敗した場合はプロンプトを送信しない` | A non-zero driver exit fails closed without a prompt. |
| T041 | `自動化が停止を報告した場合はプロンプトを送信しない` | A reported stop fails closed without a prompt. |
| T042 | `決定論的な判断を設定していない場合は通常のプロンプトを送信する` | Automations without a driver retain their normal prompt behavior. |

Each scenario creates the same scheduled, precheck-passing automation state and trigger as its replaced Vitest case. Its one Then assertion observes the delivered prompt list, so it detects the same user-visible behavior without coupling the specification to runner state fields or result enum names. The seven corresponding Vitest cases were removed after the acceptance scenarios passed; the remaining Vitest cases continue to cover internal state recording and recovery behavior.

## Intentional failure check

On 2026-07-23, `acceptance/steps/automation-driver-results.steps.ts` was temporarily changed from:

```ts
assert.deepEqual(this.sent, ["decision prompt"]);
```

to:

```ts
assert.deepEqual(this.sent, ["wrong prompt"]);
```

Then `npm run test:acceptance` exited with status 1. It identified `判断が必要な場合は判断用プロンプトだけを送信する` at `acceptance/features/automation-driver-results.feature.md:18`, reported the source-mapped TypeScript Then callback, and showed the `decision prompt` versus `wrong prompt` assertion diff. The expected assertion was restored immediately; the clean acceptance run is part of the normal verification.
