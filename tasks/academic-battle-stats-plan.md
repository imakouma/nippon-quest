# Implementation Plan: 文理ステータス・ポケモン型戦闘計算

## Status

Draft for human approval. Source specification: `SPEC-academic-battle-stats.md`.

Task tracking: `tasks/academic-battle-stats-todo.md`。既存の `tasks/plan.md` と `tasks/todo.md` は別作業のため変更しない。

## Overview

戦闘能力を8整数へ移行し、理系・文系技で異なる攻防ペアを使う。初期値と全コンテンツを同じ縮尺で小さくし、5・10レベルの節目成長を追加する。ダメージ式はポケモン第5世代以降の基礎構造と丸め順へ寄せ、行動順は優先度・素早さ・シード付き同速抽選で決める。既存セーブとリプレイ決定論性を維持し、変更前後の相対難度を自動比較する。

## Approved Decisions

- 初期基準値：HP24 / MP6 / 理攻5 / 文攻5 / 理防4 / 文防4 / 速5 / 賢3
- 節目成長：Lv5・10・15…到達時。Lv10・20…では追加の大節目ボーナスも得る
- 同速：シード付き50%抽選
- 優先度+1：逃走・入れ替え・道具
- 通常攻撃：両攻撃・両防御の切り捨て平均
- 生活科：技ごとにカテゴリを明示
- 主人公・仲間・敵・装備を同一方針で縮尺変換
- 既存セーブを自動移行

## Dependency Graph

```text
現行バランス基準の記録
  └─ 新Stats・成長契約
       ├─ セーブ移行
       ├─ コンテンツ変換
       └─ 表示層の新能力対応
            └─ 文理ダメージ式
                 └─ 優先度・素早さ順ラウンド
                      └─ 全体シミュレーション調整
                           └─ E2E・ドキュメント・プレビュー
```

## Architecture Decisions

### One canonical Stats contract

`Stats` を8能力へ一度に切り替え、互換用の `atk` / `def` をランタイム契約に残さない。旧形式はセーブ移行と一回限りのコンテンツ変換スクリプトだけが読む。

### Integer display, deterministic calculation

表示・最終能力は整数にする。基礎成長率は小数を許可するが、レベル1からの累積値を一度だけ切り捨てる。各レベルで丸め済み値を足し直さないため、誤差やセーブ依存の成長差を生まない。

### Explicit milestones, no compounding

5レベル節目と10レベル節目は整数加算テーブルで表し、割合を現在値へ掛け続けない。レベルからいつでも再計算できる純粋関数にする。

### Pokémon-like core with educational modifiers

基礎ダメージはレベル・技威力・選択された攻防能力・段階的切り捨てを使う。問題スコア、コンボ、属性、弱点、装備耐性、会心、85〜100%乱数は基礎値の後へ順番を固定して適用する。

### Round actions as sortable intents

主人公コマンド、オトモ自動行動、敵AI行動を実行前のIntentへ変換し、優先度→実効素早さ→同速乱数で並べる。実行直前に生存・MP・対象を再確認する。

### Mechanical content migration

596件の能力値JSONを手作業で編集しない。変換スクリプトをテストし、差分監査レポートを生成してから機械変換する。生成後のJSONは通常どおりGit管理し、ランタイムで旧形式を受け付けない。

## Implementation Phases

### Phase 1: Baseline and contracts

1. 現行の代表戦闘を固定シードで計測し、撃破ターン・被撃破ターン・ダメージ・逃走率をJSONへ出す。
2. `Stats`、成長設定、技カテゴリのZod契約と型を8能力へ変更する。
3. レベル能力計算を、累積基礎成長＋Lv5/Lv10節目へ変更する。

Checkpoint: 新契約と成長境界テストが通り、基準データが再現可能である。

### Phase 2: Safe migration and content conversion

4. v9セーブを新バージョンへ移行し、現在HP/MP割合と全進捗を維持する。
5. モンスター・装備・セット・主人公設定・技を新契約へ機械変換する。
6. メニュー、バッグ、HUD、特殊ボーナスを新能力名へ追従する。

Checkpoint: 全コンテンツが新スキーマで検証され、旧セーブを読み込める。

### Phase 3: Damage vertical slice

7. 攻撃カテゴリから攻防ペアを選ぶ純粋関数を追加する。
8. ポケモン型基礎ダメージ、段階的切り捨て、85〜100%乱数、整数賢さ補正へ切り替える。
9. 青森の通常敵・中ボス・県ボスで戦闘イベントとUI表示を確認する。

Checkpoint: 文理の得意不得意がダメージへ反映され、固定シードの期待値が一致する。

### Phase 4: Speed initiative vertical slice

10. 行動Intentと優先度・素早さ・同速抽選のソートを追加する。
11. `act` をIntent順実行へ移行し、戦闘不能、回復、入れ替え、逃走、状態効果を保つ。
12. イベント列、ナレーション、リプレイ、アリーナの回帰を修正する。

Checkpoint: 高速な敵が先行し、優先行動が先に動き、同速を同じシードで再現できる。

### Phase 5: Balance and delivery

13. 全モンスターを完璧・平均・不正解中心の条件でシミュレーションする。
14. 変換係数、成長、技威力、問題倍率を許容範囲内へ調整する。
15. GDD・アーキテクチャ・コンテンツテンプレートを新仕様へ同期する。
16. 全検査と実ブラウザ確認を行い、修正版サーバーを5173で開く。

Checkpoint: 全品質検査、バトルE2E、セーブ移行、バランス許容範囲、実画面確認が完了する。

## Verification Strategy

Focused commands:

```bash
pnpm exec vitest run tests/unit/battle.test.ts
pnpm exec vitest run tests/unit/state.test.ts
pnpm exec vitest run tests/unit/content.test.ts
pnpm validate:content
pnpm audit:battle-balance
pnpm test:e2e:battle
```

Final commands:

```bash
pnpm lint
pnpm check:architecture
pnpm test
pnpm validate:content
pnpm build
pnpm test:e2e:battle
```

Runtime checks:

- 新規ゲームで8能力と低い初期値を表示する。
- 旧セーブでHP/MP割合、装備、仲間、学習進捗を維持する。
- 理系技と文系技が異なる防御を参照する。
- 高速敵が主人公より先に行動する。
- 道具・入れ替え・逃走が通常攻撃より先に処理される。
- Lv5・Lv10の結果画面で節目成長を確認する。

## Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| 596件のJSON変換で値や書式を壊す | 高 | 一回限りの純粋変換スクリプト、変換前後監査、`validate:content`、差分集計 |
| 小さい能力値で丸め誤差が支配的になる | 高 | 代表値テーブルと全件シミュレーションを先に作り、威力とHP縮尺を同時調整 |
| 敵先攻で回復前に倒される | 高 | 道具・入れ替えを優先度+1にし、KO境界テストを追加 |
| 同速乱数追加でリプレイが壊れる | 高 | 既存RNGだけを使用し、同一シードのイベント列を完全比較 |
| 文理分割で一方だけ極端に弱い敵が生まれる | 中 | 初回は旧値を両方へコピーし、個性付けはシミュレーション後に限定的に行う |
| 既存セーブの現在HPが新最大HPを超える | 中 | 最大HP比で換算し、1〜新最大HPへクランプ |
| 既存UIに新しい4項目が収まらない | 中 | メニュー・バッグ・バトル状態を実ブラウザで960×540と640×540確認 |
| 問題スコア2倍と属性2倍が重なり一撃化する | 中 | 倍率を個別ではなく組合せ分布で監査し、変更には再承認を求める |

## Scope Exclusions

- 個体値、努力値、性格
- 命中率、回避率
- ポケモン型のタイプ一致補正
- 天候、トリックルーム
- 技ごとの詳細な優先度追加
- 最大レベル、XPテーブルの変更
- 問題レンダラー契約の変更

## Approval Gate

この計画と `tasks/academic-battle-stats-todo.md` の承認後に限り、Phase 1から実装を開始する。
