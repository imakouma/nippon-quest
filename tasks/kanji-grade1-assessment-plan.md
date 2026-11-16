# 小学1年生の漢字筆記判定

基点: 4129ff35 / branch: codex/kanji-grade1-assessment
仕様: SPEC-kanji-grade1-assessment.md

- [x] kanji-recognizerの実装・ライセンスを確認し、80字のKanjiVGデータを固定版から取得。依存追加は既存の認識アルゴリズムを利用するため。svg-path-propertiesは生成時だけSVGを座標へ変換するためのdevDependency。
- [x] 採点の回帰テストを先に作成し、文字識別、画数、筆順、方向、終端の評価を実装。
- [x] 既存Canvasへ接続し線幅・ガイド・結果表示を調整。読みと上級学年の挙動を保持。
- [x] 単体/関連検査、必須検査、実ブラウザ正誤入力・表示を確認し、レビューとコミット。

GraphifyでtraceMatchの依存を確認済み。変更はTraceCanvas、KanjiTraceView、近接採点モジュール、i18n、テストへ限定する。JSONモジュールの配信修正のためvite.config.tsも変更。

リスク: 位置ずれ許容と誤字検出の両立、幼児の揺らぎ、筆圧のない端末の終筆判断。基準筆跡だけで精度を断定せず、誤入力も検証し限界を報告する。
