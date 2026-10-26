# Spec: fast-quality-loop

## Objective

日常作業では変更範囲に比例する高速な検査を使い、統合時には従来同等以上の完全検査を一度だけ実行できるようにする。整形ツールが巨大なテストfixture、マップ、画像・映像ディレクトリを毎回走査しないことを成功条件とする。

## Commands

- Fast gate: `pnpm check:fast`
- Full gate: `pnpm check:full`
- Formatting: `pnpm lint`
- Architecture: `pnpm check:architecture`

## Project Structure

- `package.json`: 公開する検査コマンド
- `.prettierignore`: 意味検査・専用検査へ委譲する大容量データ
- `AGENTS.md`: 並行チャットの検査所有権

## Code Style

既存の pnpm スクリプト命名を保ち、`fast` と `full` を明示する。既存の `lint`、`test`、`check` は互換性を維持する。

## Testing Strategy

変更前後で同一マシン上の `pnpm lint` と高速ゲートを計測する。完全ゲートで検査対象が失われていないことを確認する。

## Boundaries

- Always: コンテンツの意味検査は `validate:content` に残す。
- Ask first: なし（本計画は一括承認済み）。
- Never: 失敗する検査を無効化して高速化しない。

## Success Criteria

- Prettier が `tests/fixtures`、`assets`、`maps` を通常走査しない。
- `check:fast` と `check:full` の責務が明文化される。
- 並行チャットで完全検査を同時実行しない規則がある。

## Open Questions

なし。
