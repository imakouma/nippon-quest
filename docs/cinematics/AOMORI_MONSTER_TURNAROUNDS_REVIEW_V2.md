# 青森 第1バッチ：4方向設定画 5体

2026-10-21。全キャラ設定画の第1バッチ。元ドットを基準に制作し、既存のリンゴロン設定画へ質感と配置を揃えた。各画像は **左上：正面／右上：斜め／左下：側面／右下：背面**。

5体とも内部目視検品済み。2026-10-21、この外観方針で全キャラ展開を続けるユーザー指示を受領。各1536×1024。これは映像用の外観参照であり、厳密な正投影図や実3Dモデルではない。本番への組み込みは別工程。

[全体計画](../../tasks/character-turnarounds-plan.md) ／ [チェックリスト](../../tasks/character-turnarounds-todo.md) ／ [参照・全プロンプト・生成記録](../../docs/cinematics/AOMORI_MONSTER_TURNAROUNDS_V2.json)

## 1. サクラポン

[元ドットを見る](../../assets/cinematics/monsters/aomori-turnarounds-v2/pixel-references/aomori-sakurapon.png) ／ [設定画を開く](../../assets/cinematics/monsters/aomori-turnarounds-v2/aomori-sakurapon/turnaround-v1.png)

![サクラポンの正面・斜め・側面・背面](../../assets/cinematics/monsters/aomori-turnarounds-v2/aomori-sakurapon/turnaround-v1.png)

花の輪郭・葉1枚・足2本、四角い目と横口を元ドットと照合。4方向の構造を目視確認。

## 2. センベイン

[元ドットを見る](../../assets/cinematics/monsters/aomori-turnarounds-v2/pixel-references/aomori-senbein.png) ／ [設定画を開く](../../assets/cinematics/monsters/aomori-turnarounds-v2/aomori-senbein/turnaround-v1.png)

![センベインの正面・斜め・側面・背面](../../assets/cinematics/monsters/aomori-turnarounds-v2/aomori-senbein/turnaround-v1.png)

煎餅の円盤形・淡い縁・焼き粒・四角い目・足2本を照合。側面は厚みを表現し、背面へ顔を複製していない。

## 3. ネブタムシャ

[元ドットを見る](../../assets/cinematics/monsters/aomori-turnarounds-v2/pixel-references/aomori-nebuta-musha.png) ／ [設定画を開く](../../assets/cinematics/monsters/aomori-turnarounds-v2/aomori-nebuta-musha/turnaround-v1.png)

![ネブタムシャの正面・斜め・側面・背面](../../assets/cinematics/monsters/aomori-turnarounds-v2/aomori-nebuta-musha/turnaround-v1.png)

二本の金角・青兜と鎧・炎の胸紋・灯籠背面を照合。刀は身体の左腰を維持。側面の鞘は身体の陰に隠れる。

## 4. ドグウジン

[元ドットを見る](../../assets/cinematics/monsters/aomori-turnarounds-v2/pixel-references/aomori-dogu-jin.png) ／ [設定画を開く](../../assets/cinematics/monsters/aomori-turnarounds-v2/aomori-dogu-jin/turnaround-v2.png)

![ドグウジンの正面・斜め・側面・背面](../../assets/cinematics/monsters/aomori-turnarounds-v2/aomori-dogu-jin/turnaround-v2.png)

v1の突起4個をv2で5個へ修正。正面・背面で5個を確認。四角い遮光器眼・勾玉・2本脚・粘土質感を保持。

## 5. ウミネコタイチョウ

[元ドットを見る](../../assets/cinematics/monsters/aomori-turnarounds-v2/pixel-references/aomori-umineko-taicho.png) ／ [設定画を開く](../../assets/cinematics/monsters/aomori-turnarounds-v2/aomori-umineko-taicho/turnaround-v2.png)

![ウミネコタイチョウの正面・斜め・側面・背面](../../assets/cinematics/monsters/aomori-turnarounds-v2/aomori-umineko-taicho/turnaround-v2.png)

v1の背面スカーフ左右反転をv2で修正。結び目は正面画面右／背面画面左。帽子・鳥の嘴・翼2枚・足2本を保持。

## 確認結果と残り

- 5体の4方向・全身・顔・主色・主要部品を照合。PNG寸法・ハッシュ・参照パスも確認した。
- ドグウジンは頭頂5突起、ウミネコタイチョウはスカーフの左右を修正したv2が今回の確認対象。v1は履歴として残し、選定先から外した。
- 内蔵画像生成を使用。有料動画は発注していない。既存素材・元ドット・ゲームコード・ランタイム参照先は変更していない。
- このバッチ時点で既存10体に5体を追加。全国分・人物分は未完了。継続指示を受け、[青森の追加5体](AOMORI_MONSTER_TURNAROUNDS_REVIEW_V3.md)を制作した。
