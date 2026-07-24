# Issue coordination acceptance verification

Issue #118 moves the user-visible outcomes for a selected Issue into the Japanese executable acceptance specification. The deterministic coordinator behavior is unchanged.

## Classification correspondence and equivalence

The executable feature is the sole canonical acceptance specification. The migrated classification IDs correspond to these scenarios:

| Classification ID | Replaced guarantee | Acceptance scenario |
| --- | --- | --- |
| T211 | Missing contracts do not start implementation | [`実装契約が不足している場合は作業を開始しない`](../acceptance/features/issue-coordination.feature.md#シナリオ-実装契約が不足している場合は作業を開始しない) |
| T212 | Missing-contract guidance names the required sections | [`実装契約が不足している場合は修正方法を案内する`](../acceptance/features/issue-coordination.feature.md#シナリオ-実装契約が不足している場合は修正方法を案内する) |
| T213 | Planning Issues receive guidance instead of implementation | [`計画用の-issue-は実装可能な単位への分割を待つ`](../acceptance/features/issue-coordination.feature.md#シナリオ-計画用の-issue-は実装可能な単位への分割を待つ) |
| T214 | A design-document reference alone does not classify an implementable Issue as planning work | [`設計文書への参照だけを持つ-issue-は実装を開始する`](../acceptance/features/issue-coordination.feature.md#シナリオ-設計文書への参照だけを持つ-issue-は実装を開始する) |
| T215 | An implementable Issue starts work and proceeds to completion monitoring | [`実装可能な-issue-は作業開始後の完了監視へ進む`](../acceptance/features/issue-coordination.feature.md#シナリオ-実装可能な-issue-は作業開始後の完了監視へ進む) |

Each scenario runs the existing deterministic Issue coordinator with the same fixture used by the replaced Vitest case. Each Then contains one direct assertion against one observable outcome: absence of a work launch, the complete missing-contract guidance, planning guidance, work launch, or the work-to-monitoring transition. Scenario text uses product terms rather than fixture names, function names, or internal result identifiers.

Before deleting T211–T215, the new Cucumber scenarios and all 22 tests in `test/issue-coordinator-driver.test.ts` passed against the same product code on 2026-07-24. The five Vitest cases were then removed because their public guarantees were completely replaced and the Cucumber failures identify the scenario and source-mapped assertion directly.

## Intentional failure check

On 2026-07-24, the expected monitoring target in `acceptance/steps/issue-coordination.steps.ts` was temporarily changed from `issue` to `intentional-failure`. `npm run test:acceptance` exited with status 1 and reported only `実装可能な Issue は作業開始後の完了監視へ進む` at `acceptance/features/issue-coordination.feature.md:32`. The report pointed to the Then callback and assertion at `acceptance/steps/issue-coordination.steps.ts:93-94` and showed the source-mapped difference between actual `issue` and expected `intentional-failure`. The expected value was restored before the clean verification run.

## Vitest retained by scope

The following nearby classifications remain in Vitest because they retain lower-level diagnostic value or belong to a later acceptance boundary:

- T216–T217 and T219 diagnose deterministic agent naming, prompt wiring, and promise-path placement.
- T222–T224 diagnose environment wiring and renderer selection.
- T225–T229 cover the pure internal planning function.
- T235–T242 cover prompt rendering, escaping, validation commands, and static wiring.
- T218 and T220–T221 belong to the worker completion and monitoring contract in Issue #119.
- T230–T234 belong to the detailed human-facing recovery display migration rather than the selected-Issue transition in Issue #118.

T209 (no selected candidate) and T210 (cleanup-only execution) are outside Issue #118's selected-Issue premise and remain for a separate migration boundary. No classification-table deletion candidate applies to this change.
