# Implementation Plan: Battle BGM

## Overview

Stable Audio 3 Small Music を Apple Silicon 上でローカル実行して完全オリジナルの戦闘曲を生成し、既存の `bgmVolume` と Battle Scene のライフサイクルに連動させる。有料生成 API は使わず、他作業の大規模な未コミット変更を保持したまま、BGM に必要なファイルだけを狭く変更する。

## Architecture Decisions

- 最初に MLX 版 `small-music` の実行を一時ディレクトリで検証する。生成不能ならゲームコードへ未完成の変更を入れない。
- ゲーム実行時はブラウザ標準の `HTMLAudioElement` を薄いモジュールで包む。既存の Web Audio SE 実装へ長尺ストリーミング再生を混ぜない。
- BGM 管理は `src/ui/bgm.ts` に限定し、Battle Scene は `play`、音量同期、`stop` のみ呼ぶ。
- 音源は Vite が既に配信・ビルドコピーする `assets/audio/bgm/battle-theme.mp3` に置く。
- 音源の生成環境・モデル重み・中間 WAV はリポジトリへ入れない。
- Battle Scene の既存変更と競合しやすいため、差分は create/teardown とフィールド定義周辺の最小範囲に限定する。

## Dependency Graph

```text
ローカルモデル実行確認
  └─ 採用音源生成・MP3変換
       └─ BGMライフサイクルモジュール（テスト先行）
            └─ Battle Scene連携
                 └─ 生成物更新・全体検査・ブラウザ確認
```

## Task List

### Phase 1: Risk proof and asset

- [x] Task 1: Stable Audio 3 MLX のローカル実行環境を一時ディレクトリに準備する
- [x] Task 2: オリジナル戦闘曲を生成し、品質確認後に配信用 MP3 を作る

### Checkpoint: Audio asset

- [x] 有料 API を使っていない
- [x] 音源がデコード可能で、長さ・チャンネル・音量が確認できる
- [ ] 既存作品の識別可能な旋律やボーカルがないことを試聴確認する

### Phase 2: Runtime integration

- [x] Task 3: BGM ライフサイクルの失敗テストを追加する
- [x] Task 4: 最小の BGM モジュールを実装してテストを通す
- [x] Task 5: Battle Scene の開始・終了へ BGM を接続する

### Checkpoint: Integration

- [x] 集中テストが通る
- [x] Battle 終了時に BGM が停止する
- [x] 音量 0 と再生失敗がゲーム進行を妨げない

### Phase 3: Verification and handoff

- [x] Task 6: カタログを再生成し、必須検査を実行する
- [x] Task 7: 最新ビルドを 127.0.0.1:4174 で起動し直し、実ブラウザで確認する
- [x] Task 8: 変更差分をレビューし、Walkthrough と未反映データの状況を報告する

### Checkpoint: Complete

- [x] `pnpm lint`
- [x] `pnpm check:architecture`
- [x] `pnpm test`
- [x] `pnpm validate:content`
- [x] `pnpm build`
- [x] バトル開始・音量・終了を実ブラウザで確認済み
- [x] ユーザーの既存変更を破棄していない

## Risks and Mitigations

| Risk                               | Impact | Mitigation                                                           |
| ---------------------------------- | ------ | -------------------------------------------------------------------- |
| MLX 推論またはモデル取得が失敗する | 高     | 最初のタスクで隔離検証し、有料代替へ自動切替しない                   |
| 75 秒生成がメモリ不足になる        | 中     | `small-music` を使い、必要なら短い自然なループへ縮める前に報告する   |
| 自動再生制限で再生が拒否される     | 中     | rejection を処理し、ゲームを無音で継続する                           |
| ループ境界が不自然                 | 中     | 波形と試聴で確認し、生成結果の採否または短いクロスフェードを検討する |
| Battle.ts の既存変更と競合する     | 高     | 対象行を限定し、編集直前に差分を再確認する                           |
| 音源ファイルでビルドサイズが増える | 低     | MP3 へ変換し、ビットレートと実サイズを報告する                       |

## Open Questions

- なし。ユーザー承認済みの前提は `SPEC-battle-bgm.md` に記録する。
