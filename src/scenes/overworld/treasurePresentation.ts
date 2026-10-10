import type { Item } from '../../core/content/schemas';
import type { SpecialtyTreasureGain } from '../../core/progression/specialty';
import type { DialogueLine } from '../../ui/dialogue';

type Translate = (key: string, values?: Record<string, string | number>) => string;

export function itemKindPresentation(
  kind: Item['kind'] | undefined,
  translate: Translate,
): { kind: Item['kind']; kindLabel: string } {
  const resolvedKind = kind ?? 'consumable';
  const kindLabel =
    !kind || kind === 'consumable'
      ? translate('field.itemKindTool')
      : kind === 'material'
        ? translate('field.itemKindMaterial')
        : kind === 'key'
          ? translate('field.itemKindKey')
          : translate('field.itemKindEquip', { slot: translate(`slots.${kind}`) });
  return { kind: resolvedKind, kindLabel };
}

export function specialtyRewardLines(input: {
  guide: DialogueLine;
  box: string;
  itemName: string;
  count: number;
  heal?: number;
  stampCount: { n: number; total: number };
  gain: Pick<SpecialtyTreasureGain, 'gainRate' | 'totalRate' | 'complete' | 'areaName'> | null;
  translate: Translate;
}): DialogueLine[] {
  const lines: DialogueLine[] = [
    input.guide,
    {
      speaker: input.box,
      text: input.translate('field.chestOpen', { item: input.itemName, n: input.count }),
    },
  ];
  if (input.heal) lines.push({ text: input.translate('field.specialtyUse', { n: input.heal }) });
  lines.push({ text: input.translate('field.specialtyStamp', input.stampCount) });
  if (!input.gain) return lines;
  const percent = (rate: number) => Math.round(rate * 1000) / 10;
  lines.push({
    text: input.translate('field.specialtyPowerGain', {
      gain: percent(input.gain.gainRate),
      total: percent(input.gain.totalRate),
    }),
  });
  if (input.gain.complete) {
    lines.push({ text: input.translate('field.specialtyAreaComplete', { area: input.gain.areaName }) });
  }
  return lines;
}
