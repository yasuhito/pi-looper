# PROTOTYPE — 15分で開始できる初回導入経路

> **反応を得るための使い捨ての試作品です。** Issue「[READMEと初回導入体験の優先改善を決める](https://github.com/yasuhito/deadloop/issues/92)」の判断を具体化するためのもので、公開手順そのものではありません。判断後は README、セットアップガイド、doctor 診断へ必要部分を吸収し、この文書を削除または観察用資料として更新します。

## この試作品が答える問い

作者以外の利用者が、口頭の補足なしに Pi + Herdr の基準経路を安全に開始し、最初のテスト用 Issue をキューへ入れ、その後にレビュー済み PR の人間への引き渡しまで追跡できる導線はどのようなものか。

## 決定した区切り

「15分」と「最初のPR」を同じ時間目標にしない。この区切りは2026-07-10に確認済み。

- **15分の最小導入体験**: 前提条件を満たした利用者が、破棄可能な公開リポジトリで `autoMerge: false` の deadloop を起動し、doctor 診断に合格し、最初の適格 Issue をキューへ入れるまで。
- **初回導入の完走**: その Issue が Worker、検証、PR作成、レビューを経て `ready-for-human` へ到達し、利用者が停止理由と次の操作を説明できるまで。エージェントの実装時間、CI、10分間隔の automation に左右されるため、15分の保証対象にしない。
- **第一級対応の証拠**: 作者以外の利用者が新しいテスト用リポジトリで、公開文書だけを使って初回導入を完走すること。口頭補足が発生した場合は未合格とする。

## README に置く最小経路の粗い案

以下は完成した文面ではなく、情報の順序と操作量を確認するための案である。

---

### Try deadloop safely

This path starts deadloop with automatic merge disabled. Use a disposable repository that you control.

#### Before you start

You need:

- Pi
- Herdr and its `herdr` CLI
- GitHub CLI (`gh`) authenticated for the test repository
- a local checkout of that repository with push access
- Node.js and git

Allow about 15 minutes to install, run the preflight checks, and queue the first test Issue. Creating and reviewing the PR takes longer and depends on the task, CI, and the automation interval.

#### 1. Install the Pi package

Review the source before installing. Pi packages run with your local user permissions.

```bash
pi install git:github.com/yasuhito/deadloop
```

`npx skills@latest add yasuhito/deadloop` is an optional agent-guided setup path. It installs the deadloop setup skill, not the active Pi extension.

#### 2. Add the minimal repository policy

From the test repository root:

```bash
printf '{}\n' > deadloop.json
git add deadloop.json
git commit -m "Configure deadloop"
git push
```

An empty policy selects the package defaults. The trusted base branch is the only source for repository policy. Keep `autoMerge` disabled; do not add a local override that enables it during the trial.

#### 3. Start Pi and run preflight checks

```bash
pi
```

Then run:

```text
/deadloop-doctor
```

The target experience is one clearly labelled `PREFLIGHT PASS`, or findings with copy-paste commands. Before the first GitHub write, doctor should check at least:

- the active repository and trusted base branch were resolved;
- `gh` is authenticated and can read/write the selected repository;
- `herdr` is installed and reachable;
- the required labels exist;
- `autoMerge` is false;
- the default issue coordinator and PR reviewer automations are loaded;
- the worktree root is usable;
- the selected Worker program is available and its workspace trust prerequisites are satisfied.

The current doctor is read-only and should remain so. Missing labels should produce copy-paste `gh label create` commands rather than being created automatically.

#### 4. Queue one test Issue

Create an Issue small enough to verify safely, then add both eligibility labels:

```bash
gh issue create --title "Add a small documentation example" --body "Add one small example to the test repository README."
gh issue edit <number> --add-label ready-for-agent --add-label agent:implement
```

Check that deadloop sees it:

```text
/deadloop-status
```

The 15-minute path is complete when status shows the Issue as eligible and the automation schedule is active.

#### 5. Observe the complete handoff

Keep the Pi orchestrator session running. Use `/deadloop-status` to follow the Issue and PR. Stop and use `/deadloop-doctor` if deadloop reports a blocked state or the expected transition does not occur.

The safe first run ends when the PR has `ready-for-human`. Review and merge it yourself. Do not enable automatic merge during this trial.

---

## 現状との主な差

1. **導入コマンドの意味を最初に正す。** 現在の README は `npx skills@latest add` を主たる Install として示すが、これは Pi 拡張を有効化しない。基準経路では `pi install` を主にし、Skills CLI は任意の案内経路と明記する。
2. **前提条件を操作より前に出す。** 現在は Herdr、`gh`、権限、ローカル checkout が別資料へ分散している。準備できていない利用者を設定途中まで進ませない。
3. **空の `deadloop.json` を正常系として見せる。** 現在の `projects.example.json` はローカル上書き、CI fallback、automation 全体を含み、最初の成功に不要な判断を要求する。最小経路では共有ポリシー `{}` を使う。
4. **ラベル作成を doctor の事前診断へ接続する。** 9個のコマンドを README の主要部分に並べるだけでは、作成漏れと対象リポジトリの誤りを検出できない。doctor は自動修復せず、欠けているラベルだけの解決コマンドを示す。
5. **doctor を実行時の不具合診断だけでなく初回の事前確認にもする。** 現在の doctor は既知の詰まりを読むが、`gh` / Herdr の不在や必要ラベル不足を合格・不合格として示さない。初回副作用より前の入口にする。
6. **15分の終点をキュー投入に置く。** PR作成までの所要時間は Issue、モデル、CI、automation 間隔に依存する。短時間の約束で安全ゲートを省略させない。

## 実装する場合の優先順

### P0 — README の入口を一つにする

- 対象者、安全条件、前提条件、`pi install`、`deadloop.json`、doctor、テスト Issue、`ready-for-human` の順に並べる。
- `npx skills` と `pi install` の違いを同じ画面で説明する。
- README から開始した利用者を途中で別資料の設定一覧へ飛ばさない。

**受入条件**: 初見の利用者が「何がインストールされるか」「どのリポジトリへ作用するか」「どこで自動化が止まるか」を操作前に答えられる。

### P0 — doctor に初回事前確認を追加する

- 利用可能コマンド、GitHub認証と権限、対象リポジトリ、必須ラベル、Herdr、作業領域、設定元、`autoMerge`、automation、Agent program の確認結果を表示する。
- 不明な状態を成功として扱わない。
- 自動修復はせず、所見ごとに確認または解決コマンドを一つずつ示す。

**受入条件**: GitHub へ最初の Issue / ラベル副作用を起こす前に、既知の前提不足を安全側で検出できる。

### P1 — ラベル準備を doctor の解決フローにする

- README には標準ラベルの役割と doctor の実行だけを置く。
- doctor は不足分だけを対象リポジトリ付きの `gh label create` コマンドとして出す。
- ラベルの自動作成はしない。

**受入条件**: 一部だけ存在するリポジトリでも、不足ラベルを再実行可能な手順で補える。

### P1 — セットアップガイドを初回完走と復旧に再編する

- README の最小経路を正として、詳細ガイドは各段階の説明、予想される状態、停止時の復旧を補う。
- 初回PRの観察項目を、既存の第三者導入観察票と対応させる。
- Pi + Herdr + Pi Worker 以外は、受入確認が終わるまで実験的対応と明記する。

**受入条件**: README だけで通常経路を完走でき、詳細ガイドだけを読めば各停止状態を調べられる。

### P2 — サンプル設定を上級者向けに整理する

- `projects.example.json` はローカル上書きが必要な場合だけ案内する。
- 最小設定と全項目例を分ける。
- 初回経路に不要な `ciFallback`、独自 automation、`autoMerge: true` の判断を通常経路へ混ぜない。

**受入条件**: ゼロローカル設定の利用者がサンプル設定を編集せずに完走できる。

## 今回はしないこと

- doctor に自動修復やラベル自動作成を追加すること。
- 初回試験で `autoMerge: true` を使うこと。
- Claude Code / Codex Worker、Claude App / Codex Appを同じクイックスタートへ混ぜること。
- 15分以内のPR作成を保証するためにautomation間隔や安全ゲートを短絡すること。
- 実観察なしに、現在の文書上の仮説を「第三者が完走した証拠」と扱うこと。

## 確認済みの判断

- 15分の約束は、doctor 診断に合格し、最初のテスト用 Issue がキューへ入った時点までとする。
- レビュー済みPRの `ready-for-human` 到達は、時間保証のない「初回導入の完走」として別に計測する。
- 初回事前確認のために新しいコマンドは増やさず、既存の `/deadloop-doctor` を読み取り専用のまま拡張する。
- `/deadloop-doctor` はラベルを自動作成せず、不足しているラベルだけについて、対象リポジトリを明示した再実行可能な `gh label create` コマンドを提示する。
- README の基準導入経路は `pi install git:github.com/yasuhito/deadloop` とする。`npx skills@latest add yasuhito/deadloop` は Pi を対象に選べるが、追加するのはセットアップ skill であり、Pi package の拡張を有効化しないため任意の案内経路とする。
- 15分の計測は、Pi、Herdr、`gh`、Node.js、対象リポジトリの準備が終わった時点から始める。README はこれらを操作前の前提条件として示し、導入先へ案内する。
