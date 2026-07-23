# Cucumber 移行記録

この記録は [分類表](cucumber-test-classification.md) の ID と受け入れ仕様の対応を追跡する。受け入れシナリオへ移した後も、移行期間中は Vitest の局所的な診断を併存させる。完全な削除は移行仕様の同等性確認と人間レビュー後に行う。

## Issue #128: 公開設定と安全な既定値

受け入れ仕様の正本は [`acceptance/features/public-configuration.feature.md`](../acceptance/features/public-configuration.feature.md) である。

| 分類 ID | 処理 | 移行先または理由 |
|---|---|---|
| T076–T078 | Cucumber 移行済み | 設定ファイルの環境変数、利用者設定、同梱設定の優先順位 |
| T079–T081 | Cucumber 移行済み | 標準自動化と明示的に空の自動化設定 |
| T093–T101, T103–T104 | 一部 Cucumber 移行、残部 Vitest 継続 | 指示文の文字列整形、テンプレート公開値、起動方針、不正値の診断は Vitest に残し、エージェント種別とモデルの公開契約を Cucumber に移行 |
| T108–T111 | Cucumber 移行済み | 自動マージの明示的有効化と、既定で無効な自動マージ、CI 代替、外部レビュー |
| T112–T114 | Vitest 継続 | CI 代替コマンドとテンプレート値の低レベル整形 |
| T115–T118, T120 | 一部 Cucumber 移行、残部 Vitest 継続 | 共有方針によるモデル補完とローカル値優先を Cucumber に移行し、driverFile、再読込、方針不在の内部診断は Vitest に残す |
| T119 | Cucumber 移行済み | 共有方針がローカルで省略した指示ファイルを補うこと |
| T121–T129 | Vitest 継続 | 方針ファイルの許可キー、automation のフィールド結合、基準ブランチ要求、構文エラー、スケジューラーロックは境界・低レベル診断のため |
| T082–T092, T130–T133 | Vitest 継続 | cron 計算、文字列整形、テンプレート、作業ツリー判定、ID 正規化は低レベル処理のため |

この Issue の Cucumber シナリオは、設定を省略した利用者の観測結果と、設定元・共有方針・ローカル設定の優先結果だけを検査する。内部分類値、cron の時刻計算、文字列テンプレート、Git / runner の引数は受け入れ仕様へ持ち込まない。
