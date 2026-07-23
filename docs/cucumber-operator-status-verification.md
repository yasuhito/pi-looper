# Operator status Cucumber migration verification

This record tracks the Cucumber migration for Issue #127. The existing Vitest tests remain only where they retain local diagnostic value.

## Classification mapping

| Classification IDs | Acceptance scenario(s) |
|---|---|
| T050 | `Issue の停止コメントに復旧手順を表示する` |
| T051 | `Issue の停止コメントに安全な再投入方法を表示する` |
| T052 | `pull request の停止コメントに復旧手順を表示する` |
| T053 | `pull request の停止コメントに安全な再投入方法を表示する` |
| T054 | `現行の状態表示コマンドを登録する` |
| T380 | `実装待ちの Issue がない場合はそのことを表示する` |
| T381 | `レビュー対象の pull request を表示する` |
| T382 | `片付け候補の作業場所を表示する` |
| T383 | `稼働中の作業場所を表示する` |
| T384 | `コード更新の警告を表示する` |
| T385 | `自動化の直近の判断を表示する` |
| T386 | `設定元を表示する` |

## Intentional failure

On 2026-07-23, the assertion for `実装待ちの Issue はないと表示される` was temporarily changed to require `- eligible: #999`. `npm run test:acceptance` exited with status 1 and identified `acceptance/features/operator-status.feature.md:5` and `acceptance/steps/operator-status.steps.ts:47`; the output showed the actual `- eligible: none` line. The assertion was restored before committing, and the normal acceptance run succeeded.
