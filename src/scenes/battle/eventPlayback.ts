import type { BattleEvent } from '../../core/battle/types';
import { displayText } from '../../ui/ruby';
import { withBattleMusicDucked } from './bgm';
import { LOG_BASE_MS, LOG_CHAR_MS, LOG_MAX_MS } from './layout';
import { narrate, type NarrateCtx } from './narrate';
import { TALK_FIRST } from './sceneModel';

interface PlaybackPort {
  log(text: string): void;
  say(text: string, mode: 'wait' | 'auto'): Promise<void>;
  wait(ms: number): Promise<void>;
  animate(event: BattleEvent, next?: BattleEvent): Promise<void>;
}

/** 技の減音は演出だけに限定し、説明・次のコマンドを待つ間は通常音量に戻す。 */
export async function playBattleEvents(
  events: BattleEvent[],
  ctx: NarrateCtx,
  port: PlaybackPort,
): Promise<void> {
  for (let i = 0; i < events.length; i++) {
    const event = events[i]!;
    const lines = narrate(event, ctx, events[i - 1]);
    const talk = async () => {
      if (!lines.length) return;
      if (event.t === 'defeat' || event.t === 'bossPhase') {
        for (const line of lines)
          await port.say(line, event.t === 'defeat' || line.startsWith('「') ? 'wait' : 'auto');
        return;
      }
      for (let j = 0; j < lines.length; j += 2) {
        const text = lines.slice(j, j + 2).join('\n');
        port.log(text);
        await port.wait(Math.min(LOG_MAX_MS, LOG_BASE_MS + displayText(text).length * LOG_CHAR_MS));
      }
    };
    // 次のダメージ・回復・まもりの相手を演出へ渡す。
    const animate = () => port.animate(event, events[i + 1]);
    const animation = () =>
      event.t === 'act' && event.command === 'skill' ? withBattleMusicDucked(animate) : animate();
    if (TALK_FIRST.has(event.t)) await Promise.all([talk(), animation()]);
    else {
      await animation();
      await talk();
    }
  }
}
