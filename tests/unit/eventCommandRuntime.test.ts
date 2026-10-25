import { describe, expect, it, vi } from 'vitest';
import type { EventRuntimePorts, FieldEventCommand } from '../../src/core/events/contracts';
import { executeEventCommands } from '../../src/core/events/runtime';

function makePorts(overrides: Partial<EventRuntimePorts> = {}): EventRuntimePorts {
  return {
    dialogue: vi.fn(async () => undefined),
    choose: vi.fn(async () => 0),
    question: vi.fn(async () => 0),
    reward: vi.fn(async () => undefined),
    setFlag: vi.fn(),
    battle: vi.fn(async () => 'victory' as const),
    warp: vi.fn(async () => undefined),
    movement: vi.fn(async () => undefined),
    ...overrides,
  };
}

function signal(): AbortSignal {
  return new AbortController().signal;
}

function deferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  const promise = new Promise<T>((onResolve) => {
    resolve = onResolve;
  });
  return { promise, resolve };
}
describe('executeEventCommands', () => {
  it('8 command を順番に実行して typed local result を保持する', async () => {
    const calls: string[] = [];
    const ports = makePorts({
      dialogue: async () => {
        calls.push('dialogue');
      },
      choose: async () => {
        calls.push('choice');
        return 1;
      },
      question: async () => {
        calls.push('question');
        return 0;
      },
      reward: async (_table, score) => {
        calls.push(`reward:${score}`);
      },
      setFlag: (flag) => calls.push(`flag:${flag}`),
      battle: async () => {
        calls.push('battle');
        return 'victory';
      },
      warp: async () => {
        calls.push('warp');
      },
    });
    const commands: FieldEventCommand[] = [
      { type: 'dialogue', lines: [{ text: 'はじめよう。' }] },
      { type: 'choice', key: 'route', lines: [{ text: 'どちら？' }], choices: ['ひだり', 'みぎ'] },
      {
        type: 'question',
        key: 'score',
        request: { subject: 'sansu', gradeRange: [1, 1] },
      },
      { type: 'reward', scoreKey: 'score', table: [{ min: 0, reward: { xp: 1 } }] },
      { type: 'set-flag', flag: 'event.done' },
      { type: 'battle', key: 'fight', enemyId: 'aomori-ringoron' },
      { type: 'warp', map: 'aomori-town', spawn: 'spawn' },
      {
        type: 'branch',
        condition: { type: 'choice', key: 'route', equals: 1 },
        then: [{ type: 'dialogue', lines: [{ text: 'みぎへ すすむ。' }] }],
      },
    ];

    const result = await executeEventCommands(commands, ports, { signal: signal() });

    expect(calls).toEqual([
      'dialogue',
      'choice',
      'question',
      'reward:0',
      'flag:event.done',
      'battle',
      'warp',
      'dialogue',
    ]);
    expect(result.executedSteps).toBe(9);
    expect(result.locals.get('route')).toEqual({ type: 'choice', value: 1 });
    expect(result.locals.get('score')).toEqual({ type: 'score', value: 0 });
    expect(result.locals.get('fight')).toEqual({ type: 'battle', value: 'victory' });
    expect(result.flags.has('event.done')).toBe(true);
  });

  it.each([
    {
      name: 'score',
      setup: [{ type: 'question', key: 'answer', request: { subject: 'sansu', gradeRange: [1, 1] } }],
      condition: { type: 'score', key: 'answer', min: 0.5 },
      ports: { question: async () => 0.75 },
      flags: undefined,
    },
    {
      name: 'battle',
      setup: [{ type: 'battle', key: 'fight', enemyId: 'aomori-ringoron' }],
      condition: { type: 'battle', key: 'fight', outcome: 'victory' },
      ports: {},
      flags: undefined,
    },
    {
      name: 'flag',
      setup: [],
      condition: { type: 'flag', flag: 'story.open' },
      ports: {},
      flags: new Set(['story.open']),
    },
  ])('$name 条件で then を選ぶ', async ({ setup, condition, ports, flags }) => {
    const dialogue = vi.fn(async () => undefined);
    await executeEventCommands(
      [
        ...(setup as FieldEventCommand[]),
        {
          type: 'branch',
          condition,
          then: [{ type: 'dialogue', lines: [{ text: 'then' }] }],
          else: [{ type: 'dialogue', lines: [{ text: 'else' }] }],
        } as FieldEventCommand,
      ],
      makePorts({ dialogue, ...ports }),
      { signal: signal(), flags },
    );
    expect(dialogue).toHaveBeenCalledWith([{ text: 'then' }]);
  });

  it('false の条件では else を実行する', async () => {
    const dialogue = vi.fn(async () => undefined);
    await executeEventCommands(
      [
        {
          type: 'branch',
          condition: { type: 'flag', flag: 'missing' },
          then: [{ type: 'dialogue', lines: [{ text: 'then' }] }],
          else: [{ type: 'dialogue', lines: [{ text: 'else' }] }],
        },
      ],
      makePorts({ dialogue }),
      { signal: signal() },
    );
    expect(dialogue).toHaveBeenCalledWith([{ text: 'else' }]);
  });

  it('abort 済みなら port を呼ばない', async () => {
    const controller = new AbortController();
    controller.abort(new Error('scene shutdown'));
    const ports = makePorts();

    await expect(
      executeEventCommands([{ type: 'dialogue', lines: [{ text: 'no' }] }], ports, {
        signal: controller.signal,
      }),
    ).rejects.toThrow('scene shutdown');
    expect(ports.dialogue).not.toHaveBeenCalled();
  });

  it('port error をそのまま返して後続 command を実行しない', async () => {
    const ports = makePorts({ dialogue: vi.fn().mockRejectedValue(new Error('overlay failed')) });

    await expect(
      executeEventCommands(
        [
          { type: 'dialogue', lines: [{ text: 'first' }] },
          { type: 'warp', map: 'aomori-town' },
        ],
        ports,
        { signal: signal() },
      ),
    ).rejects.toThrow('overlay failed');
    expect(ports.warp).not.toHaveBeenCalled();
  });

  it('port の不正な score を拒否する', async () => {
    await expect(
      executeEventCommands(
        [
          {
            type: 'question',
            key: 'score',
            request: { subject: 'sansu', gradeRange: [1, 1] },
          },
        ],
        makePorts({ question: async () => 2 }),
        { signal: signal() },
      ),
    ).rejects.toMatchObject({ code: 'INVALID_PORT_RESULT' });
  });

  it.each([
    {
      name: '未知 key',
      commands: [{ type: 'reward', scoreKey: 'missing', table: [{ min: 0, reward: { xp: 1 } }] }],
      code: 'UNKNOWN_LOCAL_KEY',
    },
    {
      name: 'local type 不一致',
      commands: [
        { type: 'choice', key: 'answer', lines: [{ text: '?' }], choices: ['a'] },
        { type: 'reward', scoreKey: 'answer', table: [{ min: 0, reward: { xp: 1 } }] },
      ],
      code: 'LOCAL_RESULT_TYPE',
    },
  ])('$name を決定的な error にする', async ({ commands, code }) => {
    await expect(
      executeEventCommands(commands as FieldEventCommand[], makePorts(), { signal: signal() }),
    ).rejects.toMatchObject({ code });
  });

  it('branch 深度 8 を超える script を停止する', async () => {
    let commands: FieldEventCommand[] = [{ type: 'dialogue', lines: [{ text: 'leaf' }] }];
    for (let depth = 0; depth < 9; depth += 1)
      commands = [
        {
          type: 'branch',
          condition: { type: 'flag', flag: 'open' },
          then: commands,
        },
      ];

    await expect(
      executeEventCommands(commands, makePorts(), { signal: signal(), flags: new Set(['open']) }),
    ).rejects.toMatchObject({ code: 'BRANCH_DEPTH_LIMIT' });
  });

  it('実行 step 128 を超える script を停止する', async () => {
    const commands: FieldEventCommand[] = Array.from({ length: 129 }, () => ({
      type: 'dialogue',
      lines: [{ text: 'step' }],
    }));

    await expect(executeEventCommands(commands, makePorts(), { signal: signal() })).rejects.toMatchObject({
      code: 'STEP_LIMIT',
    });
  });
  it('movement commandを同じAbortSignalでawaitしてから次commandへ進む', async () => {
    const controller = new AbortController();
    const gate = deferred<void>();
    const calls: string[] = [];
    const movement = vi.fn(async (_command, activeSignal: AbortSignal) => {
      expect(activeSignal).toBe(controller.signal);
      calls.push('movement:start');
      await gate.promise;
      calls.push('movement:end');
    });
    const dialogue = vi.fn(async () => {
      calls.push('dialogue');
    });
    const running = executeEventCommands(
      [
        {
          type: 'movement',
          objectId: 'npc-guide',
          commands: [
            { type: 'face', direction: 'up' },
            { type: 'walk', direction: 'up' },
          ],
        },
        { type: 'dialogue', lines: [{ text: 'ついた。' }] },
      ],
      makePorts({ movement, dialogue }),
      { signal: controller.signal },
    );

    await Promise.resolve();
    expect(calls).toEqual(['movement:start']);
    expect(dialogue).not.toHaveBeenCalled();

    gate.resolve();
    const result = await running;
    expect(calls).toEqual(['movement:start', 'movement:end', 'dialogue']);
    expect(result.executedSteps).toBe(2);
  });
});
