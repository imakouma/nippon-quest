import { describe, expect, it, vi } from 'vitest';
import type { LegacyAreaEvent } from '../../src/core/content/schemas';
import type { EventRuntimePorts } from '../../src/core/events/contracts';
import { legacyAreaEventCommands } from '../../src/core/events/legacyAreaEvent';
import { executeEventCommands } from '../../src/core/events/runtime';

const event: LegacyAreaEvent = {
  id: 'aomori-ev-ringo',
  motifId: 'ringo',
  trigger: { map: 'aomori-field', objectName: 'ev_ringo' },
  once: false,
  dialogue: [{ speaker: 'りんご屋[や]', text: 'りんごを 数[かぞ]えよう。' }],
  question: { subject: 'sansu', gradeRange: [1, 2], tags: ['theme:apple'] },
  rewardByScore: [
    { min: 1, reward: { xp: 10 } },
    { min: 0, reward: { xp: 1 } },
  ],
  afterDialogue: [{ speaker: 'りんご屋[や]', text: 'よく できたね。' }],
};

const messages = {
  ask: 'ちょうせん する？',
  choices: ['はい', 'いいえ'] as const,
  later: 'また あとでね。',
};

function ports(
  choice: number,
  score = 0,
): EventRuntimePorts & {
  calls: string[];
} {
  const calls: string[] = [];
  return {
    calls,
    dialogue: async (lines) => {
      calls.push(`dialogue:${lines.map((line) => line.text).join('|')}`);
    },
    choose: async (lines, choices) => {
      calls.push(`choice:${lines[0]?.text}:${choices.join('|')}`);
      return choice;
    },
    question: async () => {
      calls.push('question');
      return score;
    },
    reward: async (_table, value) => {
      calls.push(`reward:${value}`);
    },
    setFlag: (flag) => calls.push(`flag:${flag}`),
    battle: vi.fn(async () => 'victory' as const),
    warp: vi.fn(async () => undefined),
  };
}

describe('legacyAreaEventCommands', () => {
  it('legacy event を dialogue→choice→question→reward→flag→afterDialogue に変換する', () => {
    expect(legacyAreaEventCommands(event, messages)).toEqual([
      { type: 'dialogue', lines: event.dialogue },
      {
        type: 'choice',
        key: 'challenge',
        lines: [{ speaker: 'りんご屋[や]', text: messages.ask }],
        choices: messages.choices,
      },
      {
        type: 'branch',
        condition: { type: 'choice', key: 'challenge', equals: 0 },
        then: [
          { type: 'question', key: 'score', request: event.question },
          { type: 'reward', scoreKey: 'score', table: event.rewardByScore },
          { type: 'set-flag', flag: event.id },
          { type: 'dialogue', lines: event.afterDialogue },
        ],
        else: [
          {
            type: 'dialogue',
            lines: [{ speaker: 'りんご屋[や]', text: messages.later }],
          },
        ],
      },
    ]);
  });

  it('挑戦しない場合は laterDialogue だけを実行する', async () => {
    const adapter = ports(1);

    await executeEventCommands(legacyAreaEventCommands(event, messages), adapter, {
      signal: new AbortController().signal,
    });

    expect(adapter.calls).toEqual([
      'dialogue:りんごを 数[かぞ]えよう。',
      'choice:ちょうせん する？:はい|いいえ',
      'dialogue:また あとでね。',
    ]);
  });

  it('問題が score 0 でも reward と完了 flag を実行する', async () => {
    const adapter = ports(0, 0);

    await executeEventCommands(legacyAreaEventCommands(event, messages), adapter, {
      signal: new AbortController().signal,
    });

    expect(adapter.calls).toEqual([
      'dialogue:りんごを 数[かぞ]えよう。',
      'choice:ちょうせん する？:はい|いいえ',
      'question',
      'reward:0',
      'flag:aomori-ev-ringo',
      'dialogue:よく できたね。',
    ]);
  });
});
