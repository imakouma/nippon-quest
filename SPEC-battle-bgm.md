# Battle BGM Specification

## 1. Objective

NIHON QUEST の通常バトルに、子どもが「戦いが始まった」と直感できる、明るく勢いのある完全オリジナルのインストゥルメンタル BGM を追加する。

曲は特定作品の旋律・コード進行・音色配置を再現せず、携帯ゲーム機時代のモンスター育成 RPG の戦闘曲に広く見られる次の抽象的特徴だけを参照する。

- 短く印象的な戦闘開始イントロ
- 速めのテンポと前進感のあるリズム
- 緊張感を保つ反復ベース
- 覚えやすく上昇感のある主旋律
- 長時間の学習プレイでも疲れにくい、明るくクリーンな音像

音源は専用の音楽生成 AI として Stable Audio 3 Small Music のオープンウェイトを利用し、Apple Silicon 向け MLX 実装をこの Mac 上で実行する。外部の有料生成 API は使用せず、生成料金は 0 円とする。

### Success criteria

- 通常バトル開始時に BGM が再生され、バトル中は自然にループする。
- バトル終了・Scene 終了時に音が残らず停止する。
- 設定の `bgmVolume` が再生音量へ反映され、0 のときは無音になる。
- 自動再生制限、読み込み失敗、音声デバイス不在でもゲーム進行は止まらない。
- 生成曲はボーカルなし、約 75 秒、ゲーム内ループに適した終端を持つ。
- 既存作品の識別可能な旋律や固有のサウンドロゴを含まない。
- 必須の静的検査・テスト・ビルドと、実ブラウザでのバトル遷移確認が成功する。

## 2. Constraints

### Technical

- 音源の配置先は `assets/audio/bgm/battle-theme.mp3` とする。
- ローカル生成時の WAV を確認・編集用の原本とし、ゲーム配信用に MP3 へ変換する。
- モデル、仮想環境、生成途中の WAV はリポジトリ外の一時ディレクトリへ置き、ゲームへ採用する MP3 だけを `assets/` に追加する。
- BGM の再生責務は Scene 内へ直接作り込まず、小さな音声ライフサイクル用モジュールへ分離する。
- ゲーム設定の正は既存の `GameState.settings.bgmVolume` とし、別の音量状態を増やさない。
- Battle Scene は再生開始・音量同期・終了通知だけを担当する。
- 新規ランタイム依存パッケージは追加しない。
- 音源の読み込み・再生に失敗しても例外を Scene 外へ漏らさない。
- `assets/catalog.json` などの生成物は直接編集せず、既存の生成コマンドを使用する。

### Legal and creative

- 「ポケモン風」はジャンル上の高水準な特徴の指定として扱い、特定曲の模倣は行わない。
- プロンプトに作品名、作曲家名、既存曲名、既存キャラクター名を含めない。
- 生成結果に既知の旋律との明確な類似が疑われる場合は採用せず再生成する。
- ボーカル、歌詞、第三者の音声サンプルは使用しない。

### Scope

- この変更では通常バトル用の共通曲を 1 曲追加する。
- ボス戦、勝利ジングル、敗北ジングル、フィールド BGM は対象外とする。
- BGM 設定 UI の再設計は対象外とし、既存スライダーを利用する。

## 3. Approach

### Music generation

1. Stability AI 公式の Stable Audio 3 MLX 実装と `small-music` モデルを一時ディレクトリへ取得する。
2. 作品固有名を含まない英語プロンプトで、約 60〜75 秒のインストゥルメンタル音源をローカル生成する。
3. 採用前に、イントロ、ループ終端、耳障りなピーク、ボーカル混入、既存曲らしさを試聴確認する。
4. 必要な場合のみ、同じ創作方向を保ったまま一度再生成する。
5. `ffmpeg` で適切なラウドネスとループ境界を確認し、配信用 MP3 に変換する。

プロンプト方向:

> Original upbeat handheld-era monster-battling RPG combat theme for a family-friendly educational adventure. Fast tempo, short dramatic intro, driving syncopated bass, crisp retro-inspired percussion, bright heroic lead melody, playful tension, clean modern mix, seamless loop-friendly ending. Instrumental only. Do not reference or imitate any existing franchise, composition, melody, or sound logo.

### Runtime integration

- `src/ui/audio/` または既存構成に適合する近接モジュールへ、BGM の作成・再生・音量更新・停止をまとめる。
- Battle Scene の開始時に現在の `bgmVolume` を渡して再生を要求する。
- Scene の shutdown/destroy の双方で冪等に停止できるようにする。
- ブラウザの自動再生制限が発生した場合は、最初の有効なユーザー操作後に再生できる構造にし、拒否時は無音で続行する。
- ループ境界に大きな無音やクリックがある場合は、採用音源の見直しを優先し、複雑な音声加工コードは追加しない。

### Expected file impact

- `assets/audio/bgm/battle-theme.mp3` — AI 生成した採用音源
- `src/ui/audio/...` — BGM ライフサイクル管理
- `src/scenes/Battle.ts` または近接 Battle モジュール — 開始・終了フック
- 関連する unit/integration test — 音量、停止、失敗時の安全性
- 必要な生成物 — 既存スクリプトで再生成

## 4. Code Style

- 音声制御 API は小さく保ち、Battle Scene が音源実装へ依存しすぎないようにする。
- 停止処理は複数回呼ばれても安全な冪等処理にする。
- Promise の再生失敗は明示的に処理し、空の `catch` や未処理 rejection を残さない。
- テスト可能性のため、ブラウザ音声オブジェクトの生成点を限定する。
- 無関係な整形、ファイル移動、既存のユーザー変更を混ぜない。

想定する呼び出し境界の例:

```ts
const battleBgm = createBattleBgm({ volume: gameState.settings.bgmVolume });
void battleBgm.play();

// Scene shutdown/destroy
battleBgm.stop();
```

最終的な命名と配置は、既存コード調査後に依存方向へ合う形で決定する。

## 5. Testing Strategy

### Automated

- 音量が `bgmVolume` から正しく設定されること。
- ループ設定が有効であること。
- `stop()` が複数回呼ばれても安全であること。
- 再生 Promise が reject してもゲーム側へ例外が伝播しないこと。
- Battle Scene の終了時に停止処理が呼ばれること。

変更完了時に原則として次を実行する。

```bash
pnpm lint
pnpm check:architecture
pnpm test
pnpm validate:content
pnpm build
```

### Browser verification

- 統合済み最新ビルドを `127.0.0.1:4174` で起動し直す。
- 初期状態からバトルへ入り、開始、ループ、既存 BGM 音量スライダー、0 音量を確認する。
- バトル終了後および別 Scene 遷移後に曲が残らないことを確認する。
- コンソールに音声関連の未処理例外がないことを確認する。
- 必要に応じて `?resetSaves=1` を使用し、再現可能な初期状態で最終プレビューを残す。

### Listening review

- イントロが長すぎず、戦闘開始を明確に感じられる。
- 問題文や効果音を邪魔しない音域・音圧である。
- 75 秒周期の反復が不自然に聞こえない。
- 子ども向けとして過度に攻撃的・恐怖的ではない。
- 既存作品の識別可能な旋律を想起させない。

## 6. Boundaries

### Always

- 既存の未コミット変更を保持する。
- BGM 音量設定と Scene ライフサイクルを尊重する。
- 音声再生失敗時もバトルを継続可能にする。
- 有料生成 API を使わず、ローカル推論であることを実行前に確認する。
- 生成音源とコードの両方を検証してから完了扱いにする。

### Ask first

- 有料生成 API または別モデルへの切り替え。
- モデル利用条件への追加同意、ログイン、または認証情報が必要になった場合。
- 新規ランタイム依存パッケージの追加。
- ボス戦など、この仕様の対象外への展開。
- 既存の設定 UI または保存形式の変更。

### Never

- 既存作品の曲、旋律、音源、サウンドロゴを複製・サンプリングする。
- プロバイダー認証情報をリポジトリへ保存する。
- 音声再生の成功をゲーム進行の前提にする。
- 生成物を手編集して生成元との整合性を壊す。
- ユーザーの既存変更を破棄、上書き、または無関係にコミットする。

## Assumptions requiring approval

1. 通常バトル共通の 75 秒インストゥルメンタル曲を 1 曲作る。
2. Stable Audio 3 Small Music を Apple Silicon 向け MLX 実装でローカル実行し、生成料金を 0 円とする。
3. 特定作品の直接模倣ではなく、明るい携帯機 RPG 戦闘曲という抽象的方向で制作する。
4. 既存の `bgmVolume` 設定を唯一の音量ソースとして使う。
5. ボス戦・ジングル・フィールド曲は今回の対象外とする。
6. Stability AI Community License の無償利用条件（年間売上 100 万米ドル未満）を満たす。
