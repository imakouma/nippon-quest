import { describe, expect, it } from 'vitest';
import type { ScriptedAreaEvent } from '../../src/core/events/contracts';
import { validateScriptedAreaEvent, type EventContentReferences } from '../../src/core/events/validation';

const references: EventContentReferences = {
  maps: new Set(['aomori-field']),
  monsters: new Set(['aomori-ringoron']),
  items: new Set(['aomori-ringo']),
  skills: new Set(['apple-slash']),
  recipes: new Set(['apple-pie']),
};

function scripted(steps: ScriptedAreaEvent['steps']): ScriptedAreaEvent {
  return {
    id: 'aomori-ev-validation',
    motifId: 'ringo',
    trigger: { map: 'aomori-field', objectName: 'ev_validation' },
    once: true,
    steps,
  };
}

describe('scripted area event validation', () => {
  it('有効なローカル参照と content 参照を受け入れる', () => {
    const event = scripted([
      {
        type: 'choice',
        key: 'challenge',
        lines: [{ text: 'ちょうせん する？' }],
        choices: ['はい', 'いいえ'],
      },
      {
        type: 'branch',
        condition: { type: 'choice', key: 'challenge', equals: 0 },
        then: [
          {
            type: 'question',
            key: 'score',
            request: { subject: 'sansu', gradeRange: [1, 2] },
          },
          {
            type: 'reward',
            scoreKey: 'score',
            table: [
              {
                min: 0,
                reward: {
                  items: [{ itemId: 'aomori-ringo' }],
                  skills: ['apple-slash'],
                  recipes: ['apple-pie'],
                  unlockMonsters: ['aomori-ringoron'],
                },
              },
            ],
          },
          { type: 'battle', key: 'battle-result', enemyId: 'aomori-ringoron' },
          { type: 'warp', map: 'aomori-field' },
        ],
      },
    ]);

    expect(validateScriptedAreaEvent(event, references)).toEqual([]);
  });

  it('未知・型違い・重複のローカル結果キーを理由つきで拒否する', () => {
    const event = scripted([
      {
        type: 'choice',
        key: 'result',
        lines: [{ text: 'えらんでね。' }],
        choices: ['はい'],
      },
      { type: 'reward', scoreKey: 'result', table: [{ min: 0, reward: { xp: 1 } }] },
      {
        type: 'question',
        key: 'result',
        request: { subject: 'sansu', gradeRange: [1, 2] },
      },
      {
        type: 'branch',
        condition: { type: 'battle', key: 'missing-battle', outcome: 'victory' },
        then: [],
      },
    ]);

    expect(validateScriptedAreaEvent(event, references)).toEqual(
      expect.arrayContaining([
        expect.stringContaining('local key "result" は choice ですが score が必要です'),
        expect.stringContaining('local key "result" が重複しています'),
        expect.stringContaining('local key "missing-battle" が定義されていません'),
      ]),
    );
  });

  it('分岐内だけで定義したキーと存在しない enemy/map/item を拒否する', () => {
    const event = scripted([
      {
        type: 'branch',
        condition: { type: 'flag', flag: 'ready' },
        then: [
          {
            type: 'question',
            key: 'branch-score',
            request: { subject: 'sansu', gradeRange: [1, 2] },
          },
        ],
      },
      { type: 'reward', scoreKey: 'branch-score', table: [{ min: 0, reward: { xp: 1 } }] },
      { type: 'battle', key: 'battle-result', enemyId: 'missing-enemy' },
      { type: 'warp', map: 'missing-map' },
      {
        type: 'question',
        key: 'score',
        request: { subject: 'sansu', gradeRange: [1, 2] },
      },
      {
        type: 'reward',
        scoreKey: 'score',
        table: [{ min: 0, reward: { items: [{ itemId: 'missing-item' }] } }],
      },
    ]);

    expect(validateScriptedAreaEvent(event, references)).toEqual(
      expect.arrayContaining([
        expect.stringContaining('local key "branch-score" が定義されていません'),
        expect.stringContaining('enemy "missing-enemy" が存在しません'),
        expect.stringContaining('map "missing-map" が存在しません'),
        expect.stringContaining('reward item "missing-item" が存在しません'),
      ]),
    );
  });

  it('choice の範囲外条件と reward の最低点重複を拒否する', () => {
    const event = scripted([
      {
        type: 'choice',
        key: 'route',
        lines: [{ text: 'どちら？' }],
        choices: ['ひだり', 'みぎ'],
      },
      {
        type: 'branch',
        condition: { type: 'choice', key: 'route', equals: 2 },
        then: [],
      },
      {
        type: 'question',
        key: 'score',
        request: { subject: 'sansu', gradeRange: [1, 2] },
      },
      {
        type: 'reward',
        scoreKey: 'score',
        table: [
          { min: 0, reward: { xp: 1 } },
          { min: 0, reward: { xp: 2 } },
        ],
      },
    ]);

    expect(validateScriptedAreaEvent(event, references)).toEqual(
      expect.arrayContaining([
        expect.stringContaining('choice 条件 route の equals 2 は choices の範囲外です'),
        expect.stringContaining('reward の min 0 が重複しています'),
      ]),
    );
  });

  it('静的な総ステップ数と分岐深さの上限を検証する', () => {
    const tooMany = scripted(
      Array.from({ length: 129 }, () => ({
        type: 'dialogue' as const,
        lines: [{ text: 'つぎへ。' }],
      })),
    );
    let nested: ScriptedAreaEvent['steps'] = [{ type: 'dialogue', lines: [{ text: 'おわり。' }] }];
    for (let i = 0; i < 9; i += 1)
      nested = [
        {
          type: 'branch',
          condition: { type: 'flag', flag: `depth-${i}` },
          then: nested,
        },
      ];

    expect(validateScriptedAreaEvent(tooMany, references)).toContain(
      'event "aomori-ev-validation": steps は 128 以下にしてください（129）',
    );
    expect(validateScriptedAreaEvent(scripted(nested), references)).toContain(
      'event "aomori-ev-validation": branch の深さは 8 以下にしてください（9）',
    );
  });
});
