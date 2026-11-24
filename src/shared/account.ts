export type LoginProvider = 'google';
export interface AccountSlotView {
  slot: 1 | 2 | 3;
  local: string | null;
  cloud?: string | null;
  status: 'synced' | 'pending' | 'conflict';
}
export interface AccountView {
  userId: string | null;
  providers: LoginProvider[];
  available: boolean;
  blocked: boolean;
  slots: AccountSlotView[];
  guestSlots: Array<{ slot: 1 | 2 | 3; label: string }>;
}
