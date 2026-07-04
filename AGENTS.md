# AGENTS.md

## プロジェクトの目的

`pi-looper` は、Pi 上で GitHub Issue の実装、PR レビュー、必要な修正、検証、マージまでの作業ループを回すための Pi package / extension です。

現在の標準 runner は Herdr ですが、長期的には Herdr 専用ツールではなく、runner を差し替えられる loop engineering tool として育てます。

## 最初に読むもの

作業前に、変更対象に応じて次を読むこと。

- 全体像: `README.md`
- Pi extension 実体: `extensions/pi-looper/README.md`
- Herdr runner の役割: `docs/herdr-runner.md`
- Package manifest: `package.json`
- Automation prompt / precheck を触る場合: `extensions/pi-looper/automations/`

Pi extension / package の仕様に関わる変更では、Pi 本体のドキュメントも確認すること。

- Extensions: `/home/yasuhito/.npm-global/lib/node_modules/@earendil-works/pi-coding-agent/docs/extensions.md`
- Packages: `/home/yasuhito/.npm-global/lib/node_modules/@earendil-works/pi-coding-agent/docs/packages.md`

## Matt workflow

このリポジトリでは、Matt skills の考え方に従って作業を進める。

- 大きな機能、公開方針、設計変更は、いきなり実装せず `/grill-with-docs` 相当の聞き取りで目的と制約を明確にする。
- 複数セッションに分かれる大きな作業は、PRD と独立した issue に分けてから実装する。
- 小さく具体的な変更は、そのまま実装してよい。ただし、完了前に差分を見直す。
- 実装では、可能な限り `/tdd` の考え方で、先に観測可能な失敗や fixture を作ってから直す。
- 変更後は `/code-review` の考え方で、仕様適合と標準適合の 2 軸を確認する。

## 設計方針

- LLM prompt は判断、説明、曖昧な状況の扱いに寄せる。
- 決定論的に判定できる処理は、prompt に埋めず、スクリプトまたは TypeScript の関数へ切り出す。
- GitHub / Herdr / git の状態は毎回コマンドで再取得し、セッションの記憶に依存しない。
- 自動マージ、head branch 削除、ラベル変更、コメント投稿は安全側に倒す。
- 公開パッケージとして使われる前提で、local path、秘密情報、個人リポジトリ固有の設定を既定値にしない。
- Herdr 固有処理は runner 境界へ寄せる。Issue / PR の状態管理は runner 非依存に保つ。

## 安全ルール

- `extensions/pi-looper/projects.json` はローカル設定であり、コミットしない。
- API key、token、private repo 固有の path、個人環境だけで成立する設定をコミットしない。
- main workspace で destructive な git 操作をしない。
- `git reset --hard`、`git clean`、強制 push、branch の強制削除は、ユーザーの明示指示なしに実行しない。
- Automation prompt の安全制約を弱めない。特に worker に push / label 操作 / PR 作成 / issue close を許す変更は、明示的な設計判断なしに行わない。
- 自動マージに関わる変更は、dry-run、manual approval、失敗時の停止条件を確認する。

## 検証

現時点では `package.json` に標準の test / lint script はない。変更内容に応じて、少なくとも次を実行する。

```bash
bash -n extensions/pi-looper/automations/*.sh
python3 -m py_compile extensions/pi-looper/automations/*.py
npm pack --dry-run
```

Automation の選定ロジック、prompt rendering、scheduler、runner 境界を変更した場合は、fixture ベースのテスト追加を優先する。テスト基盤が未整備なら、変更と同時に最小のテスト入口を作る。

## ドキュメント方針

- 公開ユーザー向けの説明は、最終的には英語を正とする。
- 当面、日本語の既存 README / prompt を変更する場合は、意味が曖昧にならないように短く書く。
- `README.md` はユーザー向け、`extensions/pi-looper/README.md` は extension 実体の運用メモ、`docs/` は設計・runner 仕様に使う。
- 新しい大きな方針を決めた場合は、README だけに埋めず、必要に応じて `docs/` に設計メモまたは ADR を追加する。

## コミット前チェック

- `git status --short` で意図しないファイルが混ざっていないことを確認する。
- `extensions/pi-looper/projects.json` や一時ファイルが staged されていないことを確認する。
- README / docs / prompt の変更は、実装と矛盾していないか読み直す。
- 自動化 prompt を変えた場合は、GitHub に書き込む文面、ラベル遷移、停止条件を重点的に見直す。
