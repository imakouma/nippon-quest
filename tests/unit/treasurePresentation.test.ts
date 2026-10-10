import { describe, expect, it } from 'vitest';
import { itemKindPresentation, specialtyRewardLines } from '../../src/scenes/overworld/treasurePresentation';

const translate = (key: string, values?: Record<string, unknown>) =>
  values ? `${key}:${JSON.stringify(values)}` : key;

describe('treasurePresentation', () => {
  it('装備品の種別表示にはスロット名を含める', () => {
    expect(itemKindPresentation('weapon', translate)).toEqual({
      kind: 'weapon',
      kindLabel: 'field.itemKindEquip:{"slot":"slots.weapon"}',
    });
  });

  it('特産品の回復量・図鑑数・戦力上昇を順番どおり表示する', () => {
    expect(
      specialtyRewardLines({
        guide: { speaker: '案内', text: '説明' },
        box: '宝箱',
        itemName: 'りんご',
        count: 1,
        heal: 12,
        stampCount: { n: 3, total: 8 },
        gain: { gainRate: 0.125, totalRate: 0.3333, complete: true, areaName: '青森県' },
        translate,
      }),
    ).toEqual([
      { speaker: '案内', text: '説明' },
      { speaker: '宝箱', text: 'field.chestOpen:{"item":"りんご","n":1}' },
      { text: 'field.specialtyUse:{"n":12}' },
      { text: 'field.specialtyStamp:{"n":3,"total":8}' },
      { text: 'field.specialtyPowerGain:{"gain":12.5,"total":33.3}' },
      { text: 'field.specialtyAreaComplete:{"area":"青森県"}' },
    ]);
  });
});
