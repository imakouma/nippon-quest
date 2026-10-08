import type { BannerKind, HudStore, PopupView, StripPopView, UiAction } from '../../ui/battle/store';

type Delay = (ms: number, done: () => void) => void;

/** Battle Scene と DOM HUD のあいだで、表示の寿命と入力待ちだけを管理する。 */
export class BattleHudFlow {
  private messageId = 0;
  private bannerId = 0;
  private popupId = 0;
  private stripId = 0;
  private gainId = 0;
  private readonly messageWaiters = new Map<number, () => void>();
  private actionWaiter: ((action: UiAction) => void) | null = null;

  constructor(
    private readonly hud: HudStore,
    private readonly wait: (ms: number) => Promise<void>,
    private readonly delay: Delay,
  ) {}

  dispose(): void {
    this.messageWaiters.clear();
    this.actionWaiter = null;
  }

  receive(action: UiAction): void {
    if (action.t === 'advance') {
      const done = this.messageWaiters.get(action.messageId);
      if (done) {
        this.messageWaiters.delete(action.messageId);
        done();
      }
      return;
    }
    this.actionWaiter?.(action);
  }

  waitFor(predicate: (action: UiAction) => boolean): Promise<UiAction> {
    return new Promise((resolve) => {
      this.actionWaiter = (action) => {
        if (!predicate(action)) return;
        this.actionWaiter = null;
        resolve(action);
      };
    });
  }

  say(text: string, mode: 'auto' | 'wait' = 'auto'): Promise<void> {
    const id = ++this.messageId;
    this.hud.set({ message: { id, text, mode }, menu: 'none' });
    return new Promise((resolve) => this.messageWaiters.set(id, resolve));
  }

  log(text: string): void {
    this.hud.set({ message: { id: ++this.messageId, text, mode: 'log' } });
  }

  prompt(text: string): void {
    this.hud.set({ message: { id: ++this.messageId, text, mode: 'prompt' } });
  }

  async showBanner(kind: BannerKind, text: string, sub?: string, subject?: string, ms = 1000): Promise<void> {
    const id = ++this.bannerId;
    this.hud.set({ banner: { id, kind, text, sub, subject } });
    await this.wait(ms);
    if (this.hud.get().banner?.id === id) this.hud.set({ banner: null });
  }

  popup(x: number, y: number, text: string, kind: PopupView['kind']): void {
    const id = ++this.popupId;
    this.hud.set((state) => ({ popups: [...state.popups, { id, x, y, text, kind }] }));
    this.delay(1300, () =>
      this.hud.set((state) => ({ popups: state.popups.filter((popup) => popup.id !== id) })),
    );
  }

  stripPop(text: string, kind: StripPopView['kind']): void {
    const id = ++this.stripId;
    this.hud.set((state) => ({ stripPops: [...state.stripPops.slice(-2), { id, text, kind }] }));
    this.delay(1200, () =>
      this.hud.set((state) => ({ stripPops: state.stripPops.filter((popup) => popup.id !== id) })),
    );
  }

  nextGainId(): number {
    return ++this.gainId;
  }
}
