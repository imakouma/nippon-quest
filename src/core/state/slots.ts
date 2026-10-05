/** セーブ先の実装に依存しない、スロット選択画面との契約。 */
export const SLOTS = [1, 2, 3] as const;
export type SlotId = (typeof SLOTS)[number];

export interface SlotSummary {
  slot: SlotId;
  exists: boolean;
  corrupted?: boolean;
  recovered?: boolean;
  name?: string;
  level?: number;
  area?: string;
  updatedAt?: number;
  signs?: number;
}
