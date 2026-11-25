import type { AccountView, LoginProvider } from '../../shared/account';

export interface AccountPanelProps {
  view: AccountView;
  onLogin(provider: LoginProvider): Promise<void>;
  onLogout(): Promise<void>;
  onImport(slot: 1 | 2 | 3): Promise<void>;
  onResolve(slot: 1 | 2 | 3, choice: 'local' | 'cloud'): Promise<void>;
  onExport(): Promise<void>;
  onClose(): void;
  onReload(): void;
  onUseGuest(): void;
  loginFailed?: boolean;
}
export type Operation = 'login' | 'export' | 'logout' | 'import' | 'resolve';
export interface AccountConfirmation {
  text: string;
  kind: Operation;
  run(): Promise<void>;
  focusId: string;
}
