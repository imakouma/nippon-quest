# Spec: Field resume snapshot v12 integration

## Objective

現行の runtime 統合ブランチへ、安全なフィールド再開スナップショットを追加する。端末内セーブ、JSON import、マップ遷移、戦闘からの通常復帰と敗北復帰で、実在するマップ上の主人公位置・向きと、`persistState: true` を持つ一意名の動的 object だけを復元する。一時的な会話・戦闘・フェード・入力ロック状態は保存しない。

この仕様は、委任時に提示された10項目の完成条件と schema/migration 変更承認を、レビュー済み要件として記録する。

## Tech Stack

- TypeScript strict / Zod v3
- Phaser 3 の Overworld Scene と既存の field-flow / transition / encounter / event / movement runtime
- Vitest unit tests / Playwright E2E
- IndexedDB via localforage

## Commands

- Focused unit: `pnpm exec vitest run tests/unit/fieldResumeSnapshot.test.ts tests/unit/savePersistence.test.ts tests/unit/state.test.ts`
- Focused E2E: `E2E_PORT=4176 pnpm exec playwright test tests/e2e/save-persistence.spec.ts`
- Regression E2E: `E2E_PORT=4176 pnpm exec playwright test <runtime regression specs>`
- Lint: `pnpm lint`
- Architecture: `pnpm check:architecture`
- Full unit: `pnpm test`
- Content: `pnpm validate:content`
- Build: `pnpm build`
- Preview: `pnpm exec vite preview --host 127.0.0.1 --port 4176 --strictPort`

## Project Structure

- `src/core/state/`: schema v12、v0→v1 と v11→v12 migration、新規ゲーム既定値
- `src/scenes/overworld/fieldResumeSnapshot.ts`: Phaser 非依存の capture / validation / map fallback
- `src/scenes/overworld/fieldResumeRuntime.ts`: 現行 NPC・collision・map-entry 境界への adapter
- `src/scenes/Overworld.ts`: runtime の生成と既存復帰経路の調停のみ
- `tests/unit/fieldResumeSnapshot.test.ts`: 純粋ロジックの境界テスト
- `tests/e2e/save-persistence.spec.ts`: 実ブラウザでの保存・再読込・復帰

## Code Style

```ts
const entry = resolveMapEntry({ request, map, saved });
```

正規 helper を直接再利用し、同じ優先順位や walkability 判定を別実装しない。新しい責務は `overworld/` の小さな module に置き、`Overworld.ts` は wiring に限定する。

## Testing Strategy

- RED: schema v12、v0〜v11 migration、round-trip、invalid map/coordinate/object、opt-in、duplicate name、visible/facing の unit を先に失敗させる。
- GREEN: schema と純粋 snapshot resolver、次に Phaser adapter、最後に各復帰経路を接続する。
- E2E: 保存→再読込→つづきからで位置・向き・opt-in object を確認し、JSON import、map transition、battle continue / defeat return の既存経路を回帰確認する。
- 最終 gate は project の lint / architecture / full unit / content / build と実ブラウザ console。

## Boundaries

- Always: 既存9機能を保持し、`mapEntry.ts` と既存 runtime ports を再利用する。
- Ask first: 追加依存、外部LLM、semantic labeling、共有ブランチへの merge/push、本番 deploy（今回は行わない）。
- Approved: save schema v12 と backward-compatible migration。
- Never: 会話・戦闘・フェード等の一時flow、名前が空または重複するobject、`persistState !== true` のobjectを保存しない。

## Success Criteria

1. v0〜v11 が v12 へ到達し、既存進行を保持する。
2. 有効なマップ・主人公座標・向き・一意な opt-in object の座標・向き・表示状態が往復する。
3. 削除済みマップ/object、重複名、壁・範囲外座標は正規 map entry / object 定義へ戻る。
4. 通常ロード、JSON import、map transition、battle continue / defeat return が共通 runtime を通る。
5. 既存9機能、architecture boundary、Scene 行数予算を壊さない。
6. 指定 unit/E2E/全検査と preview console が成功する。

## Open Questions

なし。要件と schema 変更は委任文で承認済み。
