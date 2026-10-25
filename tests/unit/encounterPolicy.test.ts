import { describe, expect, it } from 'vitest';
import type { Area } from '../../src/core/content/schemas';
import {
  adaptEncounterStep,
  decideContentEncounterStep,
  selectEncounterTable,
  zoneForMap,
} from '../../src/core/encounter/contentAdapter';
import {
  createEncounterPolicyState,
  decideEncounterStep,
  type EncounterPolicyInput,
  type EncounterPacing,
} from '../../src/core/encounter/policy';
import { createRng } from '../../src/core/rng';
import { ROAD_TILE } from '../../src/core/world/ground';
import { battleFromEncounterDecision } from '../../src/scenes/overworld/encounterLifecycle';

const immediatePacing: EncounterPacing = {
  transitionInhibitSteps: 0,
  cooldownSteps: 0,
  maxMissedChecks: 3,
};

const policyInput = (
  overrides: Partial<EncounterPolicyInput<string>> = {},
): EncounterPolicyInput<string> => ({
  eligible: true,
  stepsPerCheck: 1,
  rate: 1,
  candidates: [{ encounter: 'a', weight: 1 }],
  ...overrides,
});

describe('encounter policy', () => {
  it('同じ seed と歩行列なら同じ decision 列になる', () => {
    const run = () => {
      const rng = createRng('fixed-encounter-seed');
      let state = createEncounterPolicyState();
      const decisions: Array<string | null> = [];
      for (let step = 0; step < 80; step++) {
        const result = decideEncounterStep(
          state,
          policyInput({
            stepsPerCheck: 2,
            rate: 0.35,
            candidates: [
              { encounter: 'a', weight: 1 },
              { encounter: 'b', weight: 3 },
            ],
          }),
          rng,
          immediatePacing,
        );
        state = result.state;
        decisions.push(result.decision.kind === 'encounter' ? result.decision.encounter : null);
      }
      return decisions;
    };

    expect(run()).toEqual(run());
    expect(run().some(Boolean)).toBe(true);
  });

  it('遷移直後の3歩は inhibit し、その次の対象歩から判定する', () => {
    const rng = createRng('transition');
    let state = createEncounterPolicyState();
    const decisions = [];
    for (let step = 0; step < 4; step++) {
      const result = decideEncounterStep(state, policyInput(), rng);
      state = result.state;
      decisions.push(result.decision);
    }

    expect(decisions.slice(0, 3).map((decision) => decision.kind)).toEqual(['none', 'none', 'none']);
    expect(
      decisions.slice(0, 3).map((decision) => (decision.kind === 'none' ? decision.reason : null)),
    ).toEqual(['transition-inhibit', 'transition-inhibit', 'transition-inhibit']);
    expect(decisions[3]).toMatchObject({ kind: 'encounter', encounter: 'a' });
  });

  it('戦闘決定後の4対象歩を cooldown にし、5歩目から再判定する', () => {
    const pacing = { ...immediatePacing, cooldownSteps: 4 };
    const rng = createRng('cooldown');
    let state = createEncounterPolicyState();
    const first = decideEncounterStep(state, policyInput(), rng, pacing);
    expect(first.decision.kind).toBe('encounter');
    state = first.state;

    for (let step = 0; step < 4; step++) {
      const result = decideEncounterStep(state, policyInput(), rng, pacing);
      expect(result.decision).toEqual({ kind: 'none', reason: 'cooldown' });
      state = result.state;
    }

    expect(decideEncounterStep(state, policyInput(), rng, pacing).decision.kind).toBe('encounter');
  });

  it('非対象歩は check interval と cooldown を消費しない', () => {
    const pacing = { ...immediatePacing, cooldownSteps: 1 };
    const rng = createRng('ineligible');
    const first = decideEncounterStep(createEncounterPolicyState(), policyInput(), rng, pacing);
    expect(first.decision.kind).toBe('encounter');

    const offTile = decideEncounterStep(first.state, policyInput({ eligible: false }), rng, pacing);
    expect(offTile.decision).toEqual({ kind: 'none', reason: 'ineligible' });
    expect(offTile.state.cooldownStepsRemaining).toBe(1);

    const backOnTile = decideEncounterStep(offTile.state, policyInput(), rng, pacing);
    expect(backOnTile.decision).toEqual({ kind: 'none', reason: 'cooldown' });
  });

  it('stepsPerCheck ごとにだけ確率判定する', () => {
    const rng = createRng('interval');
    let state = createEncounterPolicyState();
    const decisions = [];
    for (let step = 0; step < 3; step++) {
      const result = decideEncounterStep(state, policyInput({ stepsPerCheck: 3 }), rng, immediatePacing);
      state = result.state;
      decisions.push(result.decision);
    }
    expect(decisions).toEqual([
      { kind: 'none', reason: 'interval' },
      { kind: 'none', reason: 'interval' },
      expect.objectContaining({ kind: 'encounter' }),
    ]);
  });

  it('rate 0 は pity でも当たらず、rate 1 は必ず当たる', () => {
    const zeroRng = createRng('rate-zero');
    let zeroState = createEncounterPolicyState();
    for (let step = 0; step < 6; step++) {
      const result = decideEncounterStep(zeroState, policyInput({ rate: 0 }), zeroRng, {
        ...immediatePacing,
        maxMissedChecks: 1,
      });
      expect(result.decision).toEqual({ kind: 'none', reason: 'chance' });
      zeroState = result.state;
    }
    expect(zeroState.missedChecks).toBe(1);
    expect(
      decideEncounterStep(
        createEncounterPolicyState(),
        policyInput({ rate: 1 }),
        createRng('rate-one'),
        immediatePacing,
      ).decision,
    ).toMatchObject({ kind: 'encounter', forcedByPity: false });
  });

  it('3回連続で外れた次の check は pity で遭遇する', () => {
    const rng = createRng('pity');
    let state = createEncounterPolicyState();
    for (let miss = 0; miss < 3; miss++) {
      const result = decideEncounterStep(state, policyInput({ rate: 0.000_001 }), rng, immediatePacing);
      expect(result.decision).toEqual({ kind: 'none', reason: 'chance' });
      state = result.state;
    }

    expect(
      decideEncounterStep(state, policyInput({ rate: 0.000_001 }), rng, immediatePacing).decision,
    ).toEqual({ kind: 'encounter', encounter: 'a', forcedByPity: true });
  });

  it('table weight を固定 seed で反映する', () => {
    const rng = createRng('weighted-table');
    let state = createEncounterPolicyState();
    const count = { common: 0, rare: 0 };
    for (let step = 0; step < 2_000; step++) {
      const result = decideEncounterStep(
        state,
        policyInput({
          candidates: [
            { encounter: 'rare', weight: 1 },
            { encounter: 'common', weight: 3 },
          ],
        }),
        rng,
        immediatePacing,
      );
      state = result.state;
      if (
        result.decision.kind === 'encounter' &&
        (result.decision.encounter === 'common' || result.decision.encounter === 'rare')
      )
        count[result.decision.encounter]++;
    }

    expect(count.common).toBeGreaterThan(count.rare * 2);
  });
});

describe('encounter lifecycle adapter', () => {
  it('policy decision だけを Battle 起動データへ変換する', () => {
    const decision = {
      kind: 'encounter' as const,
      encounter: { enemyId: 'forest-a', zone: 'field' as const, ground: 'forest' as const },
      forcedByPity: false,
    };
    expect(battleFromEncounterDecision(decision, 5, createRng('level'))).toEqual(
      battleFromEncounterDecision(decision, 5, createRng('level')),
    );
    expect(battleFromEncounterDecision(decision, 5, createRng('level'))).toMatchObject({
      enemyId: 'forest-a',
      zone: 'field',
      ground: 'forest',
    });
    expect(
      battleFromEncounterDecision({ kind: 'none', reason: 'interval' }, 5, createRng('level')),
    ).toBeNull();
  });
});

describe('encounter content adapter', () => {
  const area = {
    encounters: [
      {
        zone: 'field',
        table: [
          { monsterId: 'field-a', weight: 1 },
          { monsterId: 'locked', weight: 1 },
        ],
        stepsPerCheck: 12,
        rate: 0.25,
      },
      {
        zone: 'forest',
        table: [{ monsterId: 'forest-a', weight: 1 }],
        stepsPerCheck: 10,
        rate: 0.3,
      },
      {
        zone: 'field',
        region: 'north',
        table: [{ monsterId: 'north-field', weight: 1 }],
        stepsPerCheck: 8,
        rate: 0.4,
      },
      {
        zone: 'forest',
        region: 'north',
        table: [{ monsterId: 'north-forest', weight: 1 }],
        stepsPerCheck: 6,
        rate: 0.5,
      },
      {
        zone: 'dungeon',
        table: [{ monsterId: 'dungeon-a', weight: 1 }],
        stepsPerCheck: 4,
        rate: 0.6,
      },
    ],
  } as Pick<Area, 'encounters'>;

  it('対象 map zone だけを認める', () => {
    expect(zoneForMap('aomori-field')).toBe('field');
    expect(zoneForMap('aomori-dungeon')).toBe('dungeon');
    expect(zoneForMap('aomori-town')).toBeNull();
    expect(zoneForMap('tohoku-island')).toBeNull();
  });

  it('地域の地面表、地域 field、通常地面、通常 field の順で table を選ぶ', () => {
    expect(selectEncounterTable(area, 'field', 'forest', 'north')?.table[0]?.monsterId).toBe('north-forest');
    expect(selectEncounterTable(area, 'field', 'mountain', 'north')?.table[0]?.monsterId).toBe('north-field');
    expect(selectEncounterTable(area, 'field', 'forest', null)?.table[0]?.monsterId).toBe('forest-a');
    expect(selectEncounterTable(area, 'field', 'mountain', null)?.table[0]?.monsterId).toBe('field-a');
  });

  it('町・道路・表なしを非対象にし、対象タイルを policy input に変換する', () => {
    expect(
      adaptEncounterStep({ mapKey: 'aomori-town', area, backgroundTile: 1, ground: null, region: null })
        .eligible,
    ).toBe(false);
    expect(
      adaptEncounterStep({
        mapKey: 'aomori-field',
        area,
        backgroundTile: ROAD_TILE,
        ground: 'grass',
        region: null,
      }).eligible,
    ).toBe(false);
    expect(
      adaptEncounterStep({
        mapKey: 'aomori-field',
        area: { encounters: [] },
        backgroundTile: 1,
        ground: 'grass',
        region: null,
      }).eligible,
    ).toBe(false);

    expect(
      adaptEncounterStep({
        mapKey: 'aomori-dungeon',
        area,
        backgroundTile: undefined,
        ground: null,
        region: null,
      }),
    ).toMatchObject({
      eligible: true,
      candidates: [{ encounter: { enemyId: 'dungeon-a', zone: 'dungeon', ground: null } }],
    });

    const adapted = adaptEncounterStep({
      mapKey: 'aomori-field',
      area,
      backgroundTile: 149,
      ground: 'forest',
      region: 'north',
      unlocks: { gated: new Set(['north-forest']), unlocked: ['north-forest'] },
    });
    expect(adapted).toMatchObject({ eligible: true, stepsPerCheck: 6, rate: 0.5 });
    expect(adapted.candidates).toEqual([
      {
        encounter: { enemyId: 'north-forest', zone: 'field', ground: 'forest' },
        weight: 1,
      },
    ]);
  });

  it('未解放候補を除き、候補が空なら非対象にする', () => {
    const adapted = adaptEncounterStep({
      mapKey: 'aomori-field',
      area,
      backgroundTile: 1,
      ground: 'grass',
      region: null,
      unlocks: { gated: new Set(['locked']), unlocked: [] },
    });
    expect(adapted.candidates.map((candidate) => candidate.encounter.enemyId)).toEqual(['field-a']);

    const onlyLocked = {
      encounters: [
        {
          zone: 'field',
          table: [{ monsterId: 'locked', weight: 1 }],
          stepsPerCheck: 1,
          rate: 1,
        },
      ],
    } as Pick<Area, 'encounters'>;
    expect(
      adaptEncounterStep({
        mapKey: 'aomori-field',
        area: onlyLocked,
        backgroundTile: 1,
        ground: 'grass',
        region: null,
        unlocks: { gated: new Set(['locked']), unlocked: [] },
      }).eligible,
    ).toBe(false);
  });

  it('イベント床では歩数だけ進め、判定間隔と遭遇を進めない', () => {
    const result = decideContentEncounterStep(
      createEncounterPolicyState(),
      {
        mapKey: 'aomori-field',
        area,
        backgroundTile: 1,
        ground: 'grass',
        region: null,
      },
      createRng('suppressed-event-tile'),
      true,
    );

    expect(result.decision).toEqual({ kind: 'none', reason: 'ineligible' });
    expect(result.state).toMatchObject({ traversedSteps: 1, eligibleStepsSinceCheck: 0 });
  });
});
