# 全国の県境ゲートと実在交通網

計画の正は `tasks/prefecture-border-gates-spec.md`。既存の `tasks/plan.md` と
`tasks/todo.md` は別作業の未完了項目を含むため、上書きしない。

## Task 1: 承認済み仕様を正規ドキュメントへ反映

**Acceptance criteria:**

- [x] 仕様書の状態が承認済みになっている。
- [x] GDD の県間ワープ前提が県境門・実在交通へ更新されている。
- [x] 5地方の攻略順が承認済み順序になっている。

**Verification:**

- [x] `pnpm exec prettier --check tasks/prefecture-border-gates-spec.md tasks/prefecture-border-gates-todo.md docs/00_GAME_DESIGN.md`
- [x] `git diff --check`

**Dependencies:** None

## Task 2: 進行・保存契約を赤テストで固定

**Acceptance criteria:**

- [x] 地方クリアだけでは次県の `visit:*` が増えないテストが失敗する。
- [x] 新攻略順と旧セーブ各 prefix の次目的地を固定するテストが失敗する。
- [x] 県間到着で `currentIsland` まで揃うテストが失敗する。

**Verification:**

- [x] 対象 Vitest が期待した理由で RED になる。

**Dependencies:** Task 1

## Task 3: 攻略順・訪問・旧セーブ互換を実装

**Acceptance criteria:**

- [x] `content/world/japan.json` が承認済み順序になる。
- [x] 地方クリアは未訪問県を高速移動先に追加しない。
- [x] 旧順序で途中まで進んだセーブは完了県を再要求しない。

**Verification:**

- [x] Task 2 の対象 Vitest が GREEN になる。
- [x] `pnpm validate:content`

**Dependencies:** Task 2

## Task 4: 地域ボス難易度を新順序へ再配分

**Acceptance criteria:**

- [x] 青森の既存10段階を維持する。
- [x] 残り145体が新攻略順で Lv15〜51 の単調増加になる。
- [x] 再配分が正規コマンドから決定論的に再現できる。

**Verification:**

- [x] `tests/unit/regionalProgression.test.ts`
- [x] `pnpm validate:content`

**Dependencies:** Task 3

## Checkpoint A: 進行基盤

- [x] 進行・保存・難易度の対象テストがすべて通る。
- [x] 既存セーブ互換の全 prefix が通る。
- [x] 原子的なコミットを作る。

## Task 5: 86組の正規陸上県境を地理データから生成

**Acceptance criteria:**

- [x] 国土地理院由来の共有境界から86組と代表座標を決定論的に得る。
- [x] 岡山―香川の海越し境界を陸上リンクに誤分類しない。
- [x] 県ペア、代表座標、双方向性を単体テストで固定する。

**Verification:**

- [x] 地理抽出の対象 Vitest。
- [x] `pnpm gen:terrain`

**Dependencies:** Task 1

## Task 6: 9組の実在交通カタログを実装

**Acceptance criteria:**

- [x] 9リンクが2軸モデル、両端、表示名、解放役割を持つ。
- [x] 廃止済み松山―小倉航路を含まない。
- [x] 全端点が実在する県を参照する。

**Verification:**

- [x] 交通カタログの対象 Vitest。

**Dependencies:** Task 1

## Task 7: 全国の入口・相互spawn・道路を生成

**Acceptance criteria:**

- [ ] 86陸上リンクと9交通リンクに双方向の `interPrefectureLink` がある。
- [ ] 門は自県の歩行可能地で県外陸に接し、港は海岸側にある。
- [ ] 入口・相互spawnが他オブジェクトと重ならず、町から到達できる。

**Verification:**

- [ ] `pnpm scaffold:maps --force`
- [ ] 生成マップ監査の対象 Vitest。

**Dependencies:** Tasks 5, 6

## Checkpoint B: 全国生成物

- [ ] 190個の双方向入口が存在する。
- [ ] 生成失敗時は県ペア名を含む明示エラーになる。
- [ ] 原子的なコミットを作る。

## Task 8: リンク解放判定を純粋関数で実装

**Acceptance criteria:**

- [ ] 物語順、章間、非物語、旧セーブ、devの開閉表が一意に判定される。
- [ ] 愛媛―大分は四国クリアと熊本完了の両方を要求する。
- [ ] `visit:*` を解放条件に使わない。

**Verification:**

- [ ] 解放表の対象 Vitest。

**Dependencies:** Tasks 3, 6

## Task 9: 県境門・交通入口の往復移動を実装

**Acceptance criteria:**

- [ ] 閉鎖入口は座標を変えず不足条件を伝える。
- [ ] 開放入口は正しい相互spawnへ移動する。
- [ ] 到着後の `currentIsland`、`currentArea`、`currentMap`、座標が一致する。

**Verification:**

- [ ] movement / location / object dispatch の対象 Vitest。
- [ ] 岩手―宮城のPlaywrightスモーク。

**Dependencies:** Tasks 7, 8

## Task 10: 中ボス後ワープを入口案内へ置換

**Acceptance criteria:**

- [ ] 中ボス撃破後にワープホールを生成しない。
- [ ] 地図とミチル案内が実際の県境門・交通入口を示す。
- [ ] 地方ボス後も未訪問の次県へ直接高速移動できない。

**Verification:**

- [ ] map model / guide / progression の対象 Vitest。

**Dependencies:** Tasks 8, 9

## Task 11: 実在交通の確認・移動演出を実装

**Acceptance criteria:**

- [ ] 橋・トンネル・鉄道・フェリーを種類別アイコンと文言で区別する。
- [ ] キーボード・タッチ・マウスで確認とスキップができる。
- [ ] 960×540 と844×390で読みやすく、コンソールエラーがない。

**Verification:**

- [ ] 9交通リンクのデータ駆動Playwright。
- [ ] 実ブラウザのスクリーンショット確認。

**Dependencies:** Task 9

## Task 12: 開発者モードの非汚染と復帰を実装

**Acceptance criteria:**

- [ ] dev中の横断は `visit:*` や攻略フラグを永続化しない。
- [ ] devを切ると未達リンクが閉じる。
- [ ] 通常条件で不正な現在地なら既存の訪問済み安全spawnへ戻る。

**Verification:**

- [ ] dev on/off の対象VitestとPlaywright。

**Dependencies:** Tasks 8, 9

## Checkpoint C: 完成検査

- [ ] `pnpm lint`
- [ ] `pnpm check:architecture`
- [ ] `pnpm test`
- [ ] `pnpm validate:content`
- [ ] `pnpm build`
- [ ] `tests/e2e/prefecture-border-gates.spec.ts`
- [ ] 別モデルの5軸コードレビューで必須指摘が0件。
- [ ] `graphify update .` でコードグラフを更新する。
- [ ] 統合済みブランチの最新版を4174で確認できる。
- [ ] 未コミット・未push・未反映データを報告する。
