# Spec: 仲間化アイテム「むすび玉」

## Objective

序盤から、プレイヤーが「仲間にしたい敵を弱らせ、専用アイテムを使って仲間にする」ことを理解・実行できる捕獲ループを追加する。

- 共通の消費アイテム名は「むすび玉」とする。
- 青森の町へ初めて入ったとき、ミチルが「お店でむすび玉を買おう」と自然に案内する。
- 青森を含む各町のお店で継続購入できる。
- バトル中は「どうぐ」から使い、敵のHP、問題の正解度、回答速度で成功率を決める。
- 成功すると現在の仲間化・バッグ格納・図鑑登録フローへ接続する。

## Player Experience

1. 最初のフィールドとバトル説明を終え、青森の町へ初到着する。
2. 町の到着会話のあと、ミチルが「これから出会うマナビモノと心を結ぶため、お店でむすび玉を買おう」と案内する。
3. 青森のお店に「むすび玉 30G」が並ぶ。初期所持金100Gで最低1個は無理なく購入できる。
4. 初めて購入した直後、短い会話で「敵を弱らせてから、バトルの『どうぐ』で使う」と説明する。
5. 通常バトルの「どうぐ」に所持中のむすび玉が表示される。
6. 使用すると、その地域とプレイヤーの学年に合う問題が1問出る。
7. 正解度が高く、正解までが速いほど仲間化の成功率が上がる。
8. 解答確定後に1個消費し、成功なら仲間化、失敗なら敵の行動へ進む。
9. ボスや仲間化不可の敵には選択できず、アイテムも消費しない。

## Rules and Balance

- Item id: `common-musubi-dama`
- Kind: `consumable`
- Price: `30G`
- Stock: 全都道府県の通常ショップに共通枠として追加する。
- 通常ショップで売却可能。既存ルールどおり売値は定価の半額。
- 成功率は敵固有の `recruitRate`、残りHP率、問題の `score`、回答時間 `timeMs` から計算する。
  - HP満タンでも低確率で成功可能。
  - HPが減るほど成功率が連続的に上がる。
  - 不正解（`score === 0`）では成功しない。
  - 部分点は `score` に比例して成功率へ反映する。
  - 満点時は回答が速いほど最大40%の速度ボーナスを加える。
  - 速度ボーナスは15秒で0になる連続値とし、15秒を超えても遅さによる減点はしない。
  - アクセシビリティ設定の制限時間倍率に合わせて、速度判定の基準時間も伸ばす。
  - 最大成功率は90%とし、通常のむすび玉だけでは確定にしない。
  - `isBoss` または `recruitRate <= 0` の敵は成功率0で、UIでも使用不可にする。
- 正解・不正解を問わず、問題の解答が確定したら1個消費する。ただし使用不可対象、問題を用意できなかった場合、中断時は消費しない。
- 既存の敵専用好物は残し、好物を使った「さそう」は従来どおり確定成功とする。
- 問題に答える既存の「さそう」も残し、むすび玉とは別の選択肢にする。

## Story Compatibility

- 青森で市販されるむすび玉は、旅人向けに作られた一般的な品として扱う。
- 岩手の「三つのむすび玉」は、特別な古いむすび玉に限定された相棒選択イベントとして残す。
- 岩手の説明文は「むすび玉を初めて知る」内容から、「むすび玉の由来と、この三つが特別である」内容へ調整する。
- 青森でむすび玉を購入した時点から、限定相棒を選ぶ前でも通常モンスターを仲間にできる。
- 既存セーブでは、青森到着イベントが完了済みでも未購入なら、次に青森の町へ入った際に案内を一度だけ補完表示する。

## Tech Stack

- TypeScript / Phaser 3 / Preact
- Zod content contracts
- Vitest unit tests
- Playwright E2E tests

## Commands

- Focused unit tests: `pnpm vitest run tests/unit/battle.test.ts tests/unit/town.test.ts tests/unit/storyFlow.test.ts`
- Browser test: `pnpm exec playwright test tests/e2e/battle.spec.ts tests/e2e/opening-cutscene.spec.ts`
- Lint: `pnpm lint`
- Architecture: `pnpm check:architecture`
- Full tests: `pnpm test`
- Content validation: `pnpm validate:content`
- Build: `pnpm build`
- Preview: `pnpm exec vite preview --host 127.0.0.1 --port 4174 --strictPort`

## Project Structure

- `content/items/` — むすび玉の商品データ
- `src/core/content/schemas.ts` — 仲間化用アイテム効果のデータ契約
- `src/core/battle/` — 成功率、消費、仲間化結果の純粋ロジック
- `src/core/progression/town.ts` — 全町共通のショップ在庫
- `src/scenes/overworld/` — 青森到着・初購入後の案内フロー
- `src/scenes/battle/` — バトルUIへ渡す使用可否・説明モデル
- `src/ui/battle/` — 既存どうぐ一覧での表示
- `content/i18n/ja.json` — 会話・結果文言
- `tests/unit/`, `tests/e2e/` — 回帰テスト

## Code Style

状態計算は純粋関数に置き、Sceneは調停だけを担当する。

```ts
export function musubiDamaChance(input: MusubiDamaAttempt): number {
  const { target, baseRate, hpRatio, score, timeMs, timeScale } = input;
  if (target.isBoss || baseRate <= 0) return 0;
  const hpChance = baseRate + (1 - clamp01(hpRatio)) * 0.65;
  const speedBonus = 1 + 0.4 * (1 - Math.min(1, timeMs / (15_000 * timeScale)));
  return Math.min(0.9, hpChance * clamp01(score) * speedBonus);
}
```

- 乱数は既存の `Rng` を使い、`Math.random` は使わない。
- アイテム効果はデータ契約で表し、Scene内でアイテム名を文字列分岐しない。
- 表示文言はi18nとRubyTextを使い、コードへ直書きしない。
- `Battle.ts` と `Overworld.ts` へ新しい責務を増やさず、近接モジュールへ置く。

## Testing Strategy

- Unit: 成功率がHP低下に応じて単調増加し、ボス・加入不可敵で0になる。
- Unit: 同じHP・正解度なら短時間ほど成功率が高く、15秒以降は速度による減点がない。
- Unit: 不正解は成功率0、部分点は満点より低く、アクセシビリティ倍率が速度判定へ反映される。
- Unit: 成功・失敗時の消費、使用不可時の非消費、成功時の `recruited` を検証する。
- Unit: 全町の在庫にむすび玉が1回だけ入り、30Gで購入できる。
- Unit: 青森初到着案内、初購入完了、既存セーブ補完、一度きり表示を検証する。
- E2E: 青森の町で購入し、バトルのどうぐから使うと問題が表示され、解答後に成功・失敗へ進むことを確認する。
- E2E: スマホ幅でも商品名・個数・説明・使用不可表示が見切れないことを確認する。

## Boundaries

- Always: 既存のセーブ形式を読み込めること、既存の好物仲間化を維持すること、生成物は生成コマンドで更新すること。
- Ask first: 価格30G、成功率式、アイテム名、青森イベントの発生位置を本仕様から変更する場合。
- Never: ボスを通常捕獲可能にする、失敗時にアイテムが戻る、既存の相棒・好物仲間化を削除する、Sceneで `Math.random` を使う。

## Success Criteria

- 青森の町の初回導線で、プレイヤーがむすび玉を買う目的と使い方を理解できる。
- 青森を含む全町で30Gのむすび玉を購入できる。
- バトル中にどうぐから使用すると問題が1問出て、HP低下・正解度・回答速度に応じて成功率が上がる。
- 成功時は既存の仲間・バッグ・図鑑システムへ正しく反映される。
- 失敗時は1個消費して戦闘が続き、使用不可対象では消費しない。
- 既存の問題回答型・好物型・岩手限定相棒の各仲間化フローが壊れない。
- 新規・既存セーブの両方で導入イベントが一度だけ適切に表示される。
- 必須検査と実ブラウザ検証が完了し、最新版を4174番で確認できる。

## Open Questions

- なし。上記の価格・成功率・導入タイミングを初期実装の基準とする。
