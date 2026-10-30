# 問題フォルダの整理: 機能マップ

| 機能 ID             | 役割                                                         | 依存                |
| ------------------- | ------------------------------------------------------------ | ------------------- |
| kanji-reading-merge | 小1の漢字の読みの2単元を、開発用一覧で一つにまとめる         | なし                |
| folder-organization | 学年より下の表示用フォルダの追加・削除と、問題を失わない整理 | kanji-reading-merge |
| folder-recovery     | フォルダ整理の取り消しと保存・復元                           | folder-organization |

実装順: kanji-reading-merge → folder-organization と folder-recovery を安全性のため一体で実装する。
