# Spec: Battle resume snapshot and exactly-once settlement

## Objective

戦闘中にタブの再読込・ブラウザ終了・保存失敗が起きても、直前の安全な境界から同じ戦闘を再開できるようにする。戦闘終了時の経験値・お金・ドロップ・仲間加入・撃破/正解カウンター・敗北時のお金減少は、同じ戦闘結果を更新・再試行・再通知しても一度だけ `GameState` へ反映する。

フィールドは戦闘開始直前の v12 `fieldSnapshot` を正とし、復帰した戦闘の `encounterSource` と結果を既存 `encounterLifecycle` へ戻す。UIレイアウトや戦闘演出の見た目は変えず、ダメージ理由の説明パネルは実装しない。

## Assumptions and invariants

1. 1セーブスロットで同時に進行できる戦闘は1件だけとする。
2. 戦闘IDはセーブデータの seed と単調増加する battle sequence から作り、再読込や Scene 再生成で再利用しない。現在の一時的な `mapKey:encounterSequence` は永続IDの正にしない。
3. 戦闘中の学習履歴とプレイ時間は従来どおり即時更新される。settlement は古い開始時 state ではなく、registry にある最新 `GameState` へ適用してこれらの更新を保持する。
4. 壊れた、未対応versionの、または現行contentから参照を解決できない active snapshot は、その snapshot だけを破棄する。セーブ全体は読み込み、戦闘開始直前のフィールドへ戻し、報酬も敗北ペナルティも与えない。
5. 外部作品は参照しない。名称・文言・キャラクター・画像・音楽・マップ・数値バランス・コード断片を取り込まない。

## User-visible behavior

- 戦闘のコマンド待ちで再読込すると、同じ敵、HP/MP、仲間、教科ゲージ、コンボ、ターン、バフ/状態、手持ち道具、乱数位置から戦闘へ戻る。
- 問題回答後から行動演出完了前に再読込すると、回答をもう一度記録せず、保存済みの解決済みコマンドを同じ戦闘乱数で再生する。
- 問題表示中に再読込すると、保存済みの問題選択境界から復帰する。未確定回答は破棄し、確定済み回答は再採点しない。
- Tween・カメラFX・DOM overlay・カーソル・一時メッセージ・音声/BGM位置は保存しない。Tween実行中に新しい snapshot を書かず、直前の安全境界を維持する。
- 勝利/敗北/逃走/仲間化の結果表示中に再読込しても、報酬やペナルティは二重反映されない。
- settlement の永続化が失敗した場合はフィールドへ戻らず、同じ状態の保存を再試行できる。再試行で報酬は増えない。
- settlement 済みだがフィールド側の結果処理前に中断した場合は、報酬を再適用せず、保存済み `encounterSource` から既存のボス完了・敗北復帰・arena結果処理を続ける。

## Persistence contract

現行 save schema v12 を additive な v13 へ上げ、戦闘用の永続状態を追加する。フィールドsnapshotの既存契約は変更しない。

永続状態は次を持つ。

- `nextSequence`: 次に割り当てる非負の安全な整数。
- `finalizedThrough`: settlement または安全な破棄まで完了した最大sequence。単調増加し、境界付きの settlement ledger として使う。
- `active`: `null` または現在の戦闘snapshot。
- active snapshot:
  - `formatVersion`, `battleId`, `sequence`
  - `BattleLaunchData` のうちJSON化できる encounter data/source
  - ゲーム進行に必要な `BattleState`。表示履歴 `log` は再開に不要なため安全境界で空に正規化できるが、HP、状態、ゲージ、コンボ、turn、outcome、seed、`rngState` は失わない
  - 問題選択用 RNG の seed/state
  - `perfectBySubject`
  - 安全境界を表す phase
  - settlement 後にフィールド処理へ渡す最小結果

安全境界 phase は最低限、次を区別する。

1. `awaiting-command`: 入力可能で演出タスクがなく、問題UIもない。
2. `resolved-command`: 問題採点またはコマンド選択が完了し、まだ `act` とTween列を完了していない。直列化可能な `Command` を保持する。
3. `awaiting-result`: terminal `BattleState` と結果表示/仲間加入判断の再開点。
4. `settled`: 報酬台帳は確定済みで、`encounterLifecycle` のフィールド側処理とsnapshot解放だけが残る。

v12→v13 migration は `nextSequence = 1`, `finalizedThrough = 0`, `active = null` を補い、既存の進行・所持品・学習履歴・field snapshot を変えない。新規ゲームも同じ既定値を持つ。battle snapshot の構造不正は `active = null` として救済し、セーブ全体のbackup fallbackを不要に消費しない。

## Safe checkpoint protocol

1. Overworld は既存 `checkpointField()` で戦闘直前の位置・向き・永続objectを確定する。
2. Battle は永続battleIdを割り当て、初期 `awaiting-command` snapshot の保存完了を待ってから操作を受け付ける。
3. コマンドまたは問題結果が確定したら、`resolved-command` を保存する。問題の mastery/recent/mistakes/attempts は既存の即時保存経路を維持する。
4. `act` とイベントTweenを実行中は snapshot を更新しない。中断時は同じ resolved command を、保存済みBattleState/RNGから再実行する。
5. 全イベント再生後にのみ、新しい `awaiting-command` または `awaiting-result` を保存する。
6. settlement は報酬更新、ledger更新、`active.phase = settled` を1つの `GameState` 値として作り、永続化完了を待つ。保存成功前に `battle:end` をemitしない。
7. Overworld は既存 encounter result policy を完了してフィールド状態をcheckpointし、その後に active snapshot を解放して保存する。

Phaser Scene は保存API実装へ直接依存しない。composition root が「最新stateを確定して永続化完了を返す」portを提供し、Battle/Overworldはそのportをawaitする。保存要求の並列化とbackup動作は既存 `AutosaveCoordinator` / `save()` の正規経路を再利用する。

## Exactly-once settlement

`battleSettlement.ts` に、最新stateと `(battleId, sequence, summary)` を受け取る純粋な idempotent settlement 境界を置く。

- active battleId/sequence が一致し、`sequence > finalizedThrough` の場合だけ `applyBattleResult` と `settleBattleBag` を呼ぶ。
- 同じ入力の再適用、保存再試行、重複した `battle:end`、古いSceneからの遅延結果は `applied: false` の no-op とする。
- 報酬と `finalizedThrough` は同じ返却stateに含める。別々の registry 更新にしない。
- XP、お金、drops、加入個体、図鑑、inventory、撃破/recruit/perfect counter、参加仲間XP、HP/MP、敗北時のお金減少のすべてを同じguardで囲む。
- 加入UIDは再試行ごとに再生成しない。最初のsettlementで決めた値だけを確定する。
- 最新stateへ途中の学習・プレイ時間更新が入っていても保持する。
- settled snapshot は `encounterSource` と `BattleEndPayload` を残し、フィールド側結果処理が完了するまで消さない。

```ts
const decision = settleBattleOnce(
  latestGame,
  {
    battleId: snapshot.battleId,
    sequence: snapshot.sequence,
    summary,
  },
  content,
);

if (decision.applied) await persistence.commit(decision.state);
```

## Tech stack

- TypeScript strict
- Zod v3-compatible state schema and explicit v12→v13 migration
- Phaser 3 Scene orchestration, Preact battle overlay unchanged
- Vitest unit/integration tests
- localforage + existing `AutosaveCoordinator`
- `src/core/rng.ts` seedrandom state only; `Math.random` is forbidden

新しい依存は追加しない。

## Commands

- Focused RED/GREEN: `pnpm exec vitest run tests/unit/battleResumeSnapshot.test.ts tests/unit/battleSettlement.test.ts tests/unit/state.test.ts tests/unit/savePersistence.test.ts tests/unit/encounterLifecycle.test.ts`
- Fast gate: `pnpm check:fast`
- Related tests: `pnpm test:related <changed-source-files...>`
- Lint: `pnpm lint`
- Architecture: `pnpm check:architecture`
- Full unit: `pnpm test`
- Content: `pnpm validate:content`
- Build: `pnpm build`
- Preview: `pnpm nrd` または競合しない4175以降のportで起動し、アプリ内ブラウザで再開経路を確認する

## Project structure

- `src/core/state/schema.ts`, `migrations.ts`, `newGame.ts`: v13 ledger/snapshot契約と後方互換
- `src/core/state/save.ts`, `autosave.ts` または小さな隣接module: 永続化完了をawaitできる正規checkpoint port
- `src/core/progression/battleResult.ts`: 現行の報酬計算。guardの外から直接二重適用しない
- `src/core/progression/battleSettlement.ts`: exactly-once guard、level/bag同期、settlement結果
- `src/scenes/battle/`: snapshotのcapture/restore、安全phase遷移、Scene用port
- `src/scenes/Battle.ts`: 専用moduleの調停だけ。snapshot判定やidempotencyロジックを巨大Sceneへ直書きしない
- `src/scenes/overworld/encounterLifecycle.ts` と `Overworld.ts`: persisted encounter再開、field result acknowledgement、field snapshot接続
- `tests/unit/`: schema/migration、snapshot、settlement、保存再試行、encounter再開

## Code style

- 純粋関数は入力を変更せず、新しいstateと明示的な `applied` / phaseを返す。
- `BattleState`、`BattleSummary`、`BattleLaunchData` の既存型を正とし、形の近い別型をScene内に重複定義しない。
- Sceneは「capture → persist → execute → persist」の順序だけを調停する。
- RNGはseedとstateを対で保存し、復帰時に `createRng(seed, state)` を使う。
- セーブ由来のunknownは境界で検証し、castや黙った部分fallbackで不変条件を隠さない。

## Testing strategy

TDDで各振る舞いを RED → GREEN → REFACTOR の順に実装する。

### Snapshot and migration

- v12以前の全migration経路がv13へ到達し、既存stateを維持する。
- 新規ゲーム、save/load、backup recovery、JSON export/importがsnapshotとledgerを往復する。
- command待ち、resolved command、terminal resultをround-tripできる。
- 不正phase、NaN/範囲外値、壊れたRNG、欠損content参照はactive battleだけ安全に破棄する。

### Deterministic resume

- 同じBattleState、battle RNG、question RNG、resolved commandから、更新前と同じ次state/eventsになる。
- 問題回答確定後の再開はmastery/recent/attemptを二重記録しない。
- Tween中はcheckpoint writerが呼ばれず、完了後に一度だけ次の安全境界を保存する。
- command待ち、問題中、行動演出中、結果表示中、加入選択後の各中断点を検証する。

### Settlement idempotency

- 同一結果を2回以上適用しても、XP・gold・drop・inventory・dex・counter・仲間加入・参加仲間XP・敗北ペナルティは1回分だけ変化する。
- 戦闘中に入ったplay time/learning更新を保持する。
- 1回目の保存失敗後に同じsettlementを再試行しても、永続stateは1回分になる。
- 古いbattleId、異なるactive battleId、重複 `battle:end` はno-opになる。
- settlement保存成功前はfield result handlerを呼ばず、成功後は既存handlerへ一度だけ接続する。

### Encounter and field resume

- random/boss/script/arenaのsourceとlaunch dataを復元する。
- victory/fledは戦闘前のフィールド位置へ戻り、defeatは既存lastInn policyを使う。
- settlement後・field acknowledgement前の再読込は報酬を増やさず、残りのresult policyを完了する。
- snapshot破棄時はv12 field resume経路へ戻り、戦闘報酬/ペナルティを発生させない。

状態と結果をassertし、内部method呼び出し順だけに依存するmock中心のテストにはしない。

## Boundaries

### Always

- 既存の戦闘計算、問題採点、学習履歴即時保存、field resume、encounter result policy、save backupを維持する。
- focused tests、`pnpm check:fast`、変更した全sourceを渡す `pnpm test:related` を実装中の各checkpointで実行する。
- 完了時はリポジトリ規約の `pnpm lint`, `pnpm check:architecture`, `pnpm test`, `pnpm validate:content`, `pnpm build` と実ブラウザ確認を行う。
- Graphifyはコードのみで更新し、外部LLM/semantic labelingを使わない。
- 専用branch/worktreeで変更し、検査後に原子的なコミットを作る。

### Ask first

- `src/questions/contracts.ts`、content schema、生成 `schemas/` の変更
- 新しい依存、保存形式v13を超える追加migration、共有branchへのmerge/push
- settlement対象報酬や敗北ペナルティなどゲーム仕様の変更

### Never

- Tween/DOM/Phaser object/AbortController/関数を保存しない。
- `Math.random`、時刻だけに依存するbattleId、Scene内の独自save実装を使わない。
- `tasks/plan.md` と `tasks/todo.md`、他moduleの未完了spec/plan/todoを上書きしない。
- UIの大幅変更、ダメージ理由の説明パネル、無関係な整形・リファクタを混ぜない。

## Success criteria

1. 戦闘はcommand、問題/選択の解決済み境界、resultの各安全地点からBattleStateと両RNGを使って決定論的に復帰し、Tween途中の状態を保存しない。
2. 同じbattleId/sequenceのsettlementを更新・再試行・再適用しても、XP・お金・ドロップ・仲間加入を含む全結果が一度だけ反映される。
3. settlementの保存完了前にfieldへ戻らず、中断後も既存encounter/field resume policyへ安全に接続する。
4. v12以前のセーブは進行を失わずv13へ移行し、不正なbattle snapshotだけを安全に破棄できる。
5. 現行の戦闘、問題、学習履歴、boss/arena/defeat処理、field resume、save backupの挙動を維持する。
6. focused test、`pnpm check:fast`、変更sourceの `pnpm test:related`、最終必須検査、実ブラウザ確認が成功する。
7. 変更範囲は上記moduleと関連テスト/専用task文書に限定し、`tasks/plan.md` と `tasks/todo.md` を変更しない。
8. 専用 `codex/battle-resume-settlement` branchで検査済みのコミットを作成し、統合担当の指示なしにmerge/pushしない。

## Open questions

なし。上記の安全境界、v13 additive migration、単調sequence ledger、snapshot破棄方針を実装計画の前提とする。
