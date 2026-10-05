import { describe, expect, it } from 'vitest';
import { npcModel } from '../../src/scenes/overworld/npcModel';
import { content } from './helpers';

const text = (key: string, vars?: Record<string, string>) => `${key}:${JSON.stringify(vars ?? {})}`;

describe('町NPCの表示モデル', () => {
  it('content の会話を名前・役割で優先し、未記載の町人は案内へフォールバックする', async () => {
    const area = (await content()).areas.get('aomori')!;
    const shop = npcModel({ area, objectName: 'npc_shop', objectRole: 'shop', text });
    expect(shop.role).toBe('shop');
    expect(shop.lines).toEqual(area.town!.npcs.find((npc) => npc.role === 'shop')!.dialogue);

    const villager = npcModel({ area, objectName: 'npc_talk_1', objectRole: 'talk', text });
    expect(villager.name).toContain('field.job');
    expect(villager.lines).toHaveLength(2);
    expect(villager.lines[1]?.text).toBeTruthy();
  });
});
