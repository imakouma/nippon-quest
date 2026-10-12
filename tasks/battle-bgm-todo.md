# Battle BGM Tasks

## Task 1: ローカル生成環境を検証する

**Description:** Stability AI 公式の Apple Silicon 向け MLX 実装と `small-music` モデルをリポジトリ外へ準備し、短い試験生成で動作を確認する。

**Acceptance criteria:**

- [x] 有料 API を呼ばず、M4 Mac のローカル推論として動作する
- [x] モデルや仮想環境がリポジトリへ追加されない
- [x] 失敗時は原因と必要条件を特定し、有料経路へ自動切替しない

**Verification:**

- [x] 実行ログで MLX/Metal または公式ローカル経路を確認する
- [x] `git status --short` にモデル重みや仮想環境が現れない

**Dependencies:** None

**Files likely touched:** リポジトリ内は計画・仕様のみ

**Estimated scope:** Small

## Task 2: 戦闘曲アセットを生成する

**Description:** 作品固有名を含まないプロンプトで60〜75秒の曲を生成し、試聴・技術検査後にゲーム配信用MP3へ変換する。

**Acceptance criteria:**

- [ ] ボーカルなしの完全オリジナル曲である
- [ ] 戦闘開始が伝わる短いイントロと自然な反復性がある
- [x] `assets/audio/bgm/battle-theme.mp3` がブラウザでデコード可能である

**Verification:**

- [x] `ffprobe` で形式、長さ、サンプルレート、チャンネルを確認する
- [ ] ループ境界、音圧、ボーカル混入、既存曲らしさを試聴確認する

**Dependencies:** Task 1

**Files likely touched:**

- `assets/audio/bgm/battle-theme.mp3`

**Estimated scope:** Small

## Task 3: BGMライフサイクルの失敗テストを書く

**Description:** 音量、ループ、再生拒否、冪等停止という利用者から見える振る舞いをテストで先に固定する。

**Acceptance criteria:**

- [x] 新モジュール未実装または不足動作によりテストがREDになる
- [x] ブラウザ音声境界だけをfake化し、内部実装の呼び順へ過剰依存しない
- [x] テスト名が期待動作を説明する

**Verification:**

- [x] `pnpm vitest run tests/unit/bgm.test.ts` が意図した理由で失敗する

**Dependencies:** Task 2

**Files likely touched:**

- `tests/unit/bgm.test.ts`

**Estimated scope:** Small

## Task 4: BGMモジュールを実装する

**Description:** HTMLAudioElementを薄く包み、安全な再生・音量更新・停止を提供する。

**Acceptance criteria:**

- [x] 音量を0〜1へ正規化し、loopを有効にする
- [x] play rejectionが呼び出し側へ未処理例外として漏れない
- [x] stopが複数回呼ばれても安全である

**Verification:**

- [x] `pnpm vitest run tests/unit/bgm.test.ts` がGREENになる
- [x] `pnpm lint` が通る

**Dependencies:** Task 3

**Files likely touched:**

- `src/ui/bgm.ts`
- `tests/unit/bgm.test.ts`

**Estimated scope:** Small

## Task 5: Battle Sceneへ接続する

**Description:** バトル開始時に現在のBGM音量で再生し、Scene shutdown時に必ず停止する。

**Acceptance criteria:**

- [x] 通常バトル開始時にBGM再生を要求する
- [x] `bgmVolume` が反映され、0では無音になる
- [x] teardownでBGMが停止し、再利用されるSceneに状態が残らない

**Verification:**

- [x] 関連するunit/integration testが通る
- [x] `pnpm check:architecture` が通る

**Dependencies:** Task 4

**Files likely touched:**

- `src/scenes/Battle.ts`
- 関連テスト

**Estimated scope:** Small

## Checkpoint: Tasks 1–5

- [x] 音源と実装が揃っている
- [x] 集中テストが通る
- [x] ゲーム進行は音声成否へ依存しない

## Task 6: 生成物と全体品質を検証する

**Description:** 既存スクリプトでアセットカタログを更新し、プロジェクト必須検査を実行する。

**Acceptance criteria:**

- [x] アセットカタログへBGMが反映される
- [x] 全必須検査が成功するか、既存変更由来の失敗を分離して報告できる
- [x] 無関係な既存変更を修正・整形しない

**Verification:**

- [x] `pnpm lint`
- [x] `pnpm check:architecture`
- [x] `pnpm test`
- [x] `pnpm validate:content`
- [x] `pnpm build`

**Dependencies:** Task 5

**Files likely touched:**

- `assets/catalog.json`

**Estimated scope:** Small

## Task 7: 実ブラウザで確認する

**Description:** 最新ビルドから正規プレビューを起動し直し、バトル中の再生と終了後の停止を確認する。

**Acceptance criteria:**

- [x] `127.0.0.1:4174` が最新ビルドを配信する
- [x] バトル開始・音量0・Scene終了の各状態が期待通りである
- [x] コンソールに未処理の音声エラーがない

**Verification:**

- [x] 実ブラウザで `?debug=battle` を確認する
- [x] 音声リソースが200で取得されることを確認する
- [x] 必要な確認画面をユーザーへ開いて残す

**Dependencies:** Task 6

**Files likely touched:** None

**Estimated scope:** Small

## Task 8: レビューと報告を行う

**Description:** BGM変更だけの差分を五軸レビューし、変更内容、検査結果、既存の未push・未反映データを報告する。

**Acceptance criteria:**

- [x] 正確性、セキュリティ、性能、保守性、テスト品質を確認する
- [x] BGM変更と既存変更を区別して報告する
- [x] pushやmergeはユーザー指示なしに行わない

**Verification:**

- [x] `git diff --` で対象ファイルの最終差分を確認する
- [x] `git status --short` と upstream 差分を再確認する

**Dependencies:** Task 7

**Files likely touched:** None

**Estimated scope:** Small
