# 漢字筆記データの出典

[KanjiVG](https://kanjivg.tagaini.net/)、Copyright (C) 2009/2010/2011 Ulrich Apel and contributors。
[CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/)。

元データ: https://github.com/KanjiVG/kanjivg/tree/610091c
変更: 小学1〜6年生配当1026字を学年別に抽出し、各画を64点、座標0〜1へ変換。小2〜小6は10000倍した整数座標の差分ペアで保存し、読み込み時に復元（座標の丸め誤差は240px枠で0.012px以下）。
派生データ `content/kanji/grade-one-strokes.json` と `grade-2-strokes.json`〜`grade-6-strokes.json` も同じCC BY-SA 3.0で提供する。
同JSONに出典・著作権・ライセンス・変更内容を含め、配信物にも同梱する。
再生成: `node scripts/generate-grade-one-strokes.mjs /path/to/pinned/kanjivg`

認識処理は kanji-recognizer 0.2.0 のGeometryUtilを使用（MIT、隣のライセンス参照）。
外部サーバーへの筆跡送信は行わない。
