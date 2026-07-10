# エージェント向けツールの普及経路調査

- 調査日: 2026-07-10
- 問い: [Matt skillsと主要ループツールの普及経路を比較する](https://github.com/yasuhito/deadloop/issues/85)
- 文脈: [deadloopを広く使われるツールへ育てる90日間の道筋を決める](https://github.com/yasuhito/deadloop/issues/82)
- 対象: `mattpocock/skills`、Claude Code、OpenAI Codex。Symphony / Sandcastle は、公開規模ではなく deadloop に近いループ製品の導入・デモ例として補助的に扱う

## 結論

広く使われている製品の一次資料からは、広い「AI 開発者」ではなく、既存の仕事場所にいる明確な利用者へ、**一行で試せる入口、30秒〜数分で価値が見える具体例、次の学習・共有先**を連結する共通パターンが観測できる。Matt Pocock の skills は個人の実務手順を小さく合成可能な部品として提供し、`npx`、skills.sh、巨大な既存ニュースレターを一つの導線にした。Claude Code と Codex は、ターミナルから始めた後、IDE、GitHub、Web / App、組織向け事例へ面を広げた。ただし、どの施策が普及を引き起こしたかまでは公開資料から確定できない。

一方、`mattpocock/skills` の「700万インストール」を利用者数として扱ってはならない。2026-07-10 に skills.sh は、52件の skill を掲載するページで **7.6M total installs** と表示していた。公開されている CLI は、一回の `add` で選んだ skill 名と対象エージェントを一つの計測イベントに列挙するが、非公開サーバーがそれをどう展開・重複排除・集計するかは公開されていない。したがって安全に言えるのは「skills.sh が定義する total installs が7.6Mと表示された」ということだけであり、「760万人」「760万回の CLI 実行」「760万 clone」「760万件の導入成功」と言い換えてはならない。

現在の deadloop は、一般公開向けの面を増やすより、Pi + Herdr で 2〜3人が成功する導線を短くし、その一件を **Issue にラベルを付ける → 隔離 Worker → 検証 → `autoMerge:false` で人へ渡す** 60〜90秒の無編集デモにする方が費用対効果が高い。同じ素材を README、Slack、部会、X に流用し、手動同意の利用記録で「作者以外の導入」「完走した Issue 数」を測るべきである。

## 数字の読み方

| 表現 | 所有する一次資料 | 実際に測るもの | 測らないもの |
|---|---|---|---|
| `mattpocock/skills`: **7.6M total installs** | [skills.sh repository page](https://skills.sh/mattpocock/skills)（2026-07-10取得） | skills.sh がリポジトリ全体について定義する導入指標。非公開サーバーの集計式は不明 | 固有利用者、CLI 実行回数、成功した導入先、skill の呼び出し、成果 |
| skills CLI: **11,082,172 weekly downloads** | [npm downloads API](https://api.npmjs.org/downloads/point/2026-07-02:2026-07-08/skills) | 2026-07-02〜08 の npm package download リクエスト数 | CLI 実行、`add` 成功、固有利用者。CI、キャッシュ、再取得を含み得る |
| Claude Code: **11,482,894 weekly downloads** | [npm downloads API](https://api.npmjs.org/downloads/point/2026-07-02:2026-07-08/%40anthropic-ai%2Fclaude-code) | 同期間の `@anthropic-ai/claude-code` download リクエスト数 | ネイティブ導入プログラム、IDE / Web 利用、WAU、課金者 |
| Codex: **10,625,797 weekly downloads** | [npm downloads API](https://api.npmjs.org/downloads/point/2026-07-02:2026-07-08/%40openai%2Fcodex) | 同期間の `@openai/codex` download リクエスト数 | Homebrew / 配布バイナリ / App / Web 利用、WAU |
| Codex: **5M+ weekly active users** | [OpenAI official post](https://openai.com/index/codex-for-knowledge-work/)（2026-07-10取得） | OpenAI が定義・集計する週次アクティブ利用者 | 公開文面は重複排除、対象面、活動閾値の定義を示さない |
| GitHub stars | [GitHub repositories API](https://api.github.com/repos/mattpocock/skills) | GitHub アカウントがリポジトリを star した累積数 | 導入、clone、利用、継続利用 |

### 「700万」の実装上の意味

skills.sh と組み合わせて使う `vercel-labs/skills` CLI は、公開リポジトリの導入後に `event=install`、`source`、**選択した skill 名のカンマ区切り**、対象エージェント、global scope 等を `https://add-skill.vercel.sh/t` へ送る。[telemetry.ts](https://github.com/vercel-labs/skills/blob/4ce6d48ac44c8b637db87b2102fea3baca719df1/src/telemetry.ts#L4-L10) [add.ts](https://github.com/vercel-labs/skills/blob/4ce6d48ac44c8b637db87b2102fea3baca719df1/src/add.ts#L1770-L1803)

ここから確実に言える範囲は次である。

- 一つのリポジトリを一度 `add` して複数 skill を選ぶと、クライアントが送る一つのイベントに複数名が入る。ただし、それが表示値へ何件として加算されるかは非公開である。
- 公開クライアントが送るイベントには、利用者・端末・導入先リポジトリの匿名一意 ID がない。このイベントだけから固有利用者数は算出できないが、サーバー側が別の情報で重複を扱う可能性は否定できない。
- `DISABLE_TELEMETRY` または `DO_NOT_TRACK` で送られず、非公開 GitHub リポジトリは送信を避ける。送信失敗は導入を止めない。したがって全導入の完全な台帳とは保証されない。
- 通常の GitHub 経路では、イベントの `skills` は成功分ではなく `selectedSkills` から作る。少なくとも公開クライアントだけからは「表示値の全件でファイル配置に成功した」と保証できない。
- 同じイベントに複数エージェントが列挙されるため、表示値がエージェント数だけ増えるか、サーバー側でどう不正利用や重複を除くかは公開クライアントから確定できない。集計サービスの公開仕様がない以上、7.6M は **skills.sh 定義の total installs** と注記する。

また、npm の `skills` package は同じ週に 11.1M download リクエストを受けたが、これは 7.6M の分母でも検算値でもない。`npx` による package 取得と skill 導入の計測イベントは別であり、期間も累積 / 週次で異なる。

## 比較

| 対象 | 最初の対象利用者・約束 | 導入経路 | 価値を見せるデモ | 配布・発信 | コミュニティへの次の導線 | deadloop への示唆 |
|---|---|---|---|---|---|---|
| [Matt Pocock skills](https://github.com/mattpocock/skills) | vibe coding ではなく「実アプリを作る real engineers」。制御を奪う巨大工程ではなく、日常の失敗を直す小さく合成可能な手順 | `npx skills@latest add mattpocock/skills`、対話選択、複数エージェント対応。README は **30-second setup** | 「要望ずれ→grilling」「壊れる→TDD」「泥団子→設計改善」と症状別に導入前後を説明。実在リポジトリの `CONTEXT.md` もリンク | GitHub + skills.sh 掲載。README 最上部から作者の約60,000人ニュースレターへ接続 | skill を改変・合成する明示的許可、GitHub Issues / Discussions、更新ニュースレター | 一般論でなく頻出する一痛点を入口にする。一行導入と「最初に実行するコマンド」を分けない |
| [Claude Code](https://github.com/anthropics/claude-code) | ターミナルから substantial engineering tasks を委譲したい開発者。後に組織へ拡張 | 当初 npm、現在はネイティブ導入プログラムを推奨。ターミナルに加えて VS Code / JetBrains、GitHub Actions、Web / Desktop | 2025-02-24 の研究プレビューはモデル発表と同時に実タスク委譲を提示。GA ではバックグラウンド処理と IDE 統合、公式記事では Anthropic 内部チームのデバッグ、未知コード理解、自動化事例を列挙 | Anthropic のモデル発表、製品文書、公式事例記事、GitHub | プラグイン / marketplace、GitHub 作業フロー、組織管理 | 製品単独の抽象説明より、利用者自身のリポジトリで起きる一連の仕事を見せる。成功後に統合面を増やす |
| [OpenAI Codex](https://github.com/openai/codex) | ターミナルの開発者から開始し、並列に仕事を委譲する利用者・組織へ拡張 | `npm install -g @openai/codex`、Homebrew / 配布バイナリ、IDE、Web、GitHub、Desktop App | 2025-04 の OSS CLI、クラウド処理の並列デモ、GA の Slack SDK / GitHub Action、App の複数エージェント管理画面 | OpenAI 公式発表、OSS GitHub、ChatGPT 内の既存配布面、顧客事例 | GitHub への貢献、SDK / app-server、Slack / GitHub / ChatGPT の既存業務面 | 入口を一つに保ちながら、検証済みの仕事場所へ段階拡張する。巨大な既存配布網の効果は deadloop が再現可能な戦術と分ける |
| [Symphony](https://github.com/openai/symphony) | Linear board の作業をエージェント群に委譲するチーム。参照実装であり、完成品としての一般導入を強く約束しない | リポジトリの clone と `WORKFLOW.md` を中心とする技術者向け経路 | README のファーストビューに Vimeo 動画。Linear を監視し、隔離実行、CI、作業証拠、人間レビューまでを一続きで表示 | OpenAI GitHub リポジトリ / SPEC | Issues / コード / 作業フローの変更 | deadloop に最も近いデモ文法。画面映えするエージェント数より「入力→証拠→人への引渡し」を見せる |
| [Sandcastle](https://github.com/mattpocock/sandcastle) | TypeScript で隔離された coding-agent 作業フローを組みたいライブラリ / CI 利用者 | `npm install --save-dev @ai-hero/sandcastle` → `npx @ai-hero/sandcastle init` → `.sandcastle` を編集 → `tsx` | README の quick start と implement / review / loop の実行可能な雛形 | GitHub、npm、Matt の既存発信面 | Issues / PR、TypeScript API を使う独自作業フロー | deadloop の初期利用者には工程が多すぎる。ライブラリを提供する場合には有効だが、試験利用の標準導線にしない |

比較表は「この施策が採用を因果的に増やした」とは証明しない。一次資料から観測できるのは、公開時期、入口、メッセージ、配布面、現在の計測値である。特に Anthropic / OpenAI はモデル、契約者基盤、ChatGPT、営業、資本を持つため、その絶対数を独立 OSS の基準値にしてはならない。

## 観測できる普及パターン

### 1. 最初の利用者と仕事を一文に固定する

Matt skills は「real engineers がエージェントの失敗を直す」、Claude Code は「ターミナルから substantial engineering task を委譲」、Codex は「ローカルのターミナル / クラウドで coding task を任せる」と、最初の仕事場所が明確だった。[Matt skills README](https://github.com/mattpocock/skills/blob/d574778f94cf620fcc8ce741584093bc650a61d3/README.md#L11-L35) [Claude Code launch](https://www.anthropic.com/news/claude-3-7-sonnet) [Introducing Codex](https://openai.com/index/introducing-codex/)

deadloop の初期文は「GitHub Issues in, reviewed PRs out」のままでよい。ただし対象を **Pi + Herdr を既に動かせ、GitHub Issue を小さく切り、マージは自分で判断したい個人の保守担当者か2〜10人の開発チーム** に狭める。汎用エージェントオーケストレータと呼ぶと価値も必要設定も見えなくなる。

### 2. 一行導入だけでなく、最初の成功までを短くする

Matt skills は一行の `npx` の直後に選択と `/setup-matt-pocock-skills` を指定する。Codex は npm / Homebrew の直後に `codex`、Sandcastle は導入後の `init` と実行ファイルまで示す。[Matt skills README](https://github.com/mattpocock/skills/blob/d574778f94cf620fcc8ce741584093bc650a61d3/README.md#L25-L38) [Codex README](https://github.com/openai/codex#quickstart) [Sandcastle README](https://github.com/mattpocock/sandcastle#quick-start)

deadloop の `npx skills@latest add yasuhito/deadloop` は良い入口だが、その後に Pi、Herdr、GitHub ラベル、権限、`deadloop.json` がある。試験利用では「一行で導入できる」ことを誇るより、`/deadloop-doctor` の全項目成功、テスト用 Issue 一件、`ready-for-human` までの所要時間を導入完了として扱う。

### 3. デモは機能一覧でなく状態変化と証拠を見せる

Symphony の公式 README は、Linear board 上の課題が隔離実行になり、CI と作業証拠を伴って戻る動画を最上部に置く。Claude / Codex の公式発表も、コード生成量ではなくデバッグ、並列委譲、レビュー、GitHub / IDE への引渡しを見せる。[Symphony README](https://github.com/openai/symphony#symphony) [Anthropic internal use cases](https://www.anthropic.com/news/how-anthropic-teams-use-claude-code) [Codex GA](https://openai.com/index/codex-now-generally-available/)

deadloop の一本目は、(1) 適格ラベル、(2) 状態 / worktree、(3) Worker の差分と検証、(4) PR レビュー、(5) `ready-for-human` と停止理由、の5場面だけでよい。失敗デモとして `promise` 欠落または CI 失敗で安全停止する10秒版も、差別化を説明しやすい。

### 4. 借りた配布面を使い、成功後に自前コミュニティへ戻す

Matt は skills.sh の発見面と GitHub を使いながら、README 冒頭で約60,000人の自前ニュースレターへ戻す。Claude / Codex はターミナルから IDE、GitHub、Web / App、Slack へ広げ、利用者が既にいる場所に入った。[Matt skills README](https://github.com/mattpocock/skills) [Claude Code GA](https://www.anthropic.com/news/claude-4) [Codex GA](https://openai.com/index/codex-now-generally-available/)

deadloop は当面、Pi パッケージ / skills.sh、GitHub、既存 Slack、部会、作者の X だけで十分である。新規サイトや独立 Discord は、継続利用者が質問を持ち寄る前には空の導線を増やすだけになる。

## deadloop への施策順序

### A. 現行 Pi + Herdr の試験利用（今すぐ、低工数）

1. **対象と募集文を一つにする**
   - 「Pi + Herdr を使い、GitHub Issue からレビュー済み PR までを `autoMerge:false` で安全に試したい保守担当者を2〜3人募集」。
   - 前提、所要時間、作者が初回セットアップへ同席すること、収集する情報を明記する。
2. **README の既存経路を試験利用のチェックリストとして使う**
   - 導入 → `deadloop.json` → ラベル → Pi → `/deadloop-doctor` → テスト用 Issue → `ready-for-human`。
   - 各人について「どの段で止まったか」だけを手動記録し、2人以上が同じ段で止まった場合だけ共通改善へ昇格する。
3. **一つの無編集デモを録る**
   - 60〜90秒、字幕または短いナレーション付き。入力 Issue と最終 PR URL を画面内に残し、実行速度を切り貼りした成功場面だけの編集動画にしない。
   - README の上部、Slack 個別募集、部会、X で同じ動画 / GIF を再利用する。
4. **成功指標を導入数ではなく完走で持つ**
   - 同意した試験利用者ごとに、導入者、対象リポジトリ、完走した Issue 数、自動化ホスト、初回成功までの時間、停止と復旧を手動記録する。
   - [deadloopを広く使われるツールへ育てる90日間の道筋を決める](https://github.com/yasuhito/deadloop/issues/82) の「作者以外10人、複数人が3件以上の Issue を完走、2種類以上の自動化ホスト」を正とする。GitHub stars、npm downloads、skills.sh installs は認知の補助指標に留める。
5. **成功例を短い実績カードにする**
   - 「誰の、どんな Issue」「検証 / レビュー」「どこで人へ渡したか」「失敗時にどう止まったか」を匿名化可能な4項目で掲載する。

### B. 試験利用で第三者が完走した後（一般公開前）

1. `/deadloop-doctor` の出力から、再現する上位1〜2障壁だけを直す。
2. README 冒頭を、約束 → デモ → 安全既定 → 導入 → 最初の成功、の順にする。詳細設定は下へ送る。
3. `npx skills...` の配布元を信頼できるか、版固定 / 更新、必要権限を明記する。導入手順を短く見せるために安全説明を隠さない。
4. 英語1ページの公開文と、同じ内容の短い日本語募集文を作る。GitHub release を更新情報の正本とし、各媒体はそこへ戻す。
5. GitHub Issue template に利用環境、doctor 出力、停止段階、復旧可否を入れ、支援と製品学習を同じ導線にする。

### C. 後の一般公開

1. Pi + Herdr で再現可能な初回導入手順と一件の公開事例を同時に出す。
2. skills.sh、GitHub topics / release、Pi パッケージの既存発見面を整える。X、Slack、部会には同じデモから切り出した素材を流す。
3. Claude / Codex Worker は第一級受入契約を満たしたものだけを比較デモへ加える。App 内経路は既存調査どおり、復旧まで実証するまでは「実験的」と明記する。[Claude / Codex App 調査](./claude-codex-app-automation.md)
4. 利用者から繰り返し質問が出た時点で GitHub Discussions または定期相談会のどちらか一つを開く。両方を同時に始めない。
5. 数字を公表するときは「導入者10人」だけでなく、「同意した作者以外10人が設定完了」「うちN人が各3件の Issue を完走」のように対象行動と期間を付ける。

## 推奨しないこと

- **「700万」を成功目標や利用者数として模倣しない。** deadloop が必要とするのは長時間・高権限の作業フローへの信頼であり、skill file の導入指標とは意味が違う。
- **今は自動 telemetry を追加しない。** [deadloopを広く使われるツールへ育てる90日間の道筋を決める](https://github.com/yasuhito/deadloop/issues/82) の決定どおり、少数の試験利用者から同意を得て手動記録する方が、障壁と復旧を直接学べる。
- **成功事例がない段階で独立サイト、Discord、総合チュートリアル群を作らない。** README、GitHub、既存 Slack / 部会 / X で足りる。
- **Claude Code / Codex の全配布面を同時に追わない。** まず Pi + Herdr の第一級経路を証明し、Worker アダプター、App 内実験の順にする。
- **スター、npm downloads、clone を利用者数と表記しない。** GitHub clone traffic はリポジトリ所有者にだけ見える14日窓の指標であり、公開 stars とも npm downloads とも別である。
- **高速化した成功デモだけを出さない。** deadloop の差別化は安全停止、検証証拠、人への引渡しにある。`autoMerge:true` を一般公開の見せ場にしない。
- **Matt / OpenAI / Anthropic の既存読者・利用者規模を再現可能な戦術と混同しない。** 採れるのは明確な対象、一行入口、具体デモ、既存面の再利用であり、ニュースレター60,000人や ChatGPT 配布網そのものではない。

## 一次資料

### Matt skills / skills.sh

- [mattpocock/skills README](https://github.com/mattpocock/skills/blob/d574778f94cf620fcc8ce741584093bc650a61d3/README.md) — 対象、30秒 quickstart、症状別の価値説明、約60,000人ニュースレター
- [skills.sh: mattpocock/skills](https://skills.sh/mattpocock/skills) — 2026-07-10時点の 52 skills / 7.6M total installs と skill 別 count
- [vercel-labs/skills telemetry implementation](https://github.com/vercel-labs/skills/blob/4ce6d48ac44c8b637db87b2102fea3baca719df1/src/telemetry.ts#L4-L10) — event の項目、送信停止、送信方式
- [vercel-labs/skills add implementation](https://github.com/vercel-labs/skills/blob/4ce6d48ac44c8b637db87b2102fea3baca719df1/src/add.ts#L1770-L1803) — 選択 skill / agent、公開リポジトリ判定、導入 event の生成
- [GitHub repository API: mattpocock/skills](https://api.github.com/repos/mattpocock/skills) — 2026-07-10時点の作成日、stars、forks
- [npm downloads API: skills](https://api.npmjs.org/downloads/point/2026-07-02:2026-07-08/skills) — package download リクエスト数

### Claude Code

- [Claude 3.7 Sonnet and Claude Code](https://www.anthropic.com/news/claude-3-7-sonnet) — 2025-02-24 の research preview と初期対象
- [Introducing Claude 4](https://www.anthropic.com/news/claude-4) — 2025-05-22 の GA、IDE / GitHub Actions
- [How Anthropic teams use Claude Code](https://www.anthropic.com/news/how-anthropic-teams-use-claude-code) — 公式の具体的利用例
- [Claude Code setup](https://docs.anthropic.com/en/docs/claude-code/setup) — 現行の導入経路
- [npm downloads API: Claude Code](https://api.npmjs.org/downloads/point/2026-07-02:2026-07-08/%40anthropic-ai%2Fclaude-code)

### OpenAI Codex

- [Introducing Codex](https://openai.com/index/introducing-codex/) — cloud / CLI の初期メッセージとデモ
- [Codex is now generally available](https://openai.com/index/codex-now-generally-available/) — Slack SDK、GitHub Action、組織導線
- [Introducing the Codex app](https://openai.com/index/introducing-the-codex-app/) — 複数エージェント / 並列作業フローの App デモ
- [Codex for knowledge work](https://openai.com/index/codex-for-knowledge-work/) — 5M+ WAU の公式主張。ただし定義非公開
- [openai/codex README](https://github.com/openai/codex) — npm / Homebrew / release / IDE / App / Web の入口
- [npm downloads API: Codex](https://api.npmjs.org/downloads/point/2026-07-02:2026-07-08/%40openai%2Fcodex)

### 近接ループ製品

- [openai/symphony README](https://github.com/openai/symphony/blob/4cbe3a9699a73b862466c0b157ceca0c1985d6d7/README.md) — board-to-proof-of-work demo と参照実装の位置付け
- [mattpocock/sandcastle README](https://github.com/mattpocock/sandcastle/blob/e99f832f26dc9d245c019a9ddd19fa5dee792427/README.md) — npm / init / TypeScript quickstart
- [npm downloads API: Sandcastle](https://api.npmjs.org/downloads/point/2026-07-02:2026-07-08/%40ai-hero%2Fsandcastle) — 同期間 74,161 download requests
- [既存の Symphony / Sandcastle 設計調査](./symphony-sandcastle-loop-design.md) — 製品境界の比較。普及規模の根拠には使っていない

## 限界と残る不確実性

- skills.sh のサーバー側集計、bot・不正利用の除外、重複排除、過去のスキーマ変更は公開一次資料で確認できない。7.6M の厳密な集計式は運営者への確認が必要である。
- skills.sh の表示は取得時点で変動する。本文は 2026-07-10 の記録であり、再確認時には日時を添える必要がある。
- npm downloads はリクエスト数であり、固有の導入や利用を示さない。npm 以外の導入面を足し合わせることもできない。
- Codex の 5M+ WAU は OpenAI 所有の指標だが、対象製品面、固有化、活動閾値、地域、無料 / 有料の内訳は公開文面から分からない。
- 公開一次資料だけでは、どの発信面が何件の採用を因果的に生んだかを帰属できない。比較は観測された導線と現在値であり、マーケティング実験ではない。
- GitHub リポジトリの clone traffic、referrer、unique visitor は所有者向け traffic API の短い保持期間にあり、比較対象の公開データとして取得できない。
