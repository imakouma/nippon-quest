# Spec: Encounter Policy Engine

## Objective

`Overworld` に埋め込まれた歩数 modulo・確率・出現表抽選を、Phaser 非依存で決定論的な pure policy へ分離する。小学生向けの探索テンポを守るため、画面遷移直後と戦闘直後の安全歩数を設け、抽選の連続不発には上限を設ける。

## Tech Stack

- TypeScript strict
- Vitest
- 既存の `src/core/rng.ts`（追加依存なし）

## Commands

- Focused test: `pnpm test -- tests/unit/encounterPolicy.test.ts`
- Lint: `pnpm lint`
- Architecture: `pnpm check:architecture`
- Full test: `pnpm test`
- Content validation: `pnpm validate:content`
- Build: `pnpm build`
- Preview: `pnpm preview --host 127.0.0.1 --port 4175 --strictPort`

## Project Structure

- `src/core/encounter/policy.ts`: 歩数、inhibit、cooldown、確率、pity、重み付き抽選の純粋ロジック
- `src/core/encounter/contentAdapter.ts`: マップ・地面・地域・content の出現表を policy 入力へ変換
- `src/scenes/Overworld.ts`: policy state を保持し、返された decision だけでバトルを開始
- `tests/unit/encounterPolicy.test.ts`: policy と adapter の契約テスト

## Code Style

判定結果は副作用を起こさず、次状態と decision を同時に返す。

```ts
const result = decideEncounterStep(state, input, rng);
state = result.state;
if (result.decision.kind === 'encounter') startBattle(result.decision.encounter);
```

## Testing Strategy

- RED: 新しい policy / adapter の期待動作を先に Vitest で固定する。
- GREEN: 最小の pure implementation を追加する。
- Integration: `Overworld` を policy decision の consumer に変更し、型検査と全検査を通す。
- 境界: 固定 seed、非対象タイル、遷移直後、戦闘後 cooldown、確率 0/1、pity 上限、table weight、地域・地面 table を検証する。

## Boundaries

- Always: `src/core/rng.ts` の `Rng` だけを使う。policy は Phaser / Scene / GameState を import しない。
- Ask first: content schema、保存形式、外部依存の変更。
- Never: `Math.random`、作品固有データ、HeartGold 資料からの逐語コピー、別作業の task ファイル上書き。

## Success Criteria

1. 同じ seed・初期 state・歩行入力列は同じ encounter decision 列を返す。
2. 町・島・道路・表なし・候補なしでは遭遇せず、対象フィールド／ダンジョンだけが抽選対象になる。
3. 遷移後 3 歩と戦闘後 4 対象歩は遭遇せず、`stepsPerCheck` ごとにだけ確率判定する。
4. 3 回連続で抽選に外れた次のチェックは遭遇を保証し、待ち時間を有限にする。
5. 確率 0/1 と候補 weight の境界を決定論的に扱う。
6. 地面・地域 table の選択と policy 判定が別関数になり、`Overworld` は decision を消費するだけになる。
7. 必須検査と該当 E2E / preview 確認が成功する。

## Open Questions

なし。通常の実装判断は委任文で承認済み。
