import type { ContentIndex } from '../../core/content/loader';
import { specialtyIndex, specialtyTreasureGain } from '../../core/progression/specialty';
import type { GameState } from '../../core/state/schema';
import { t } from '../../ui/i18n';

export interface SpecialtyRewardView {
  name: string;
  blurb: string;
  powerText?: string;
  completeText?: string;
}

/** 戦闘ドロップの特産品を、初回発見ボーナス込みの表示モデルへ変換する。 */
export function specialtyRewardViews(
  game: GameState,
  drops: readonly string[],
  content: Pick<ContentIndex, 'areas' | 'items'>,
): SpecialtyRewardView[] {
  const specialties = specialtyIndex(content.areas, content.items);
  const preview = structuredClone(game);
  const percent = (rate: number) => Math.round(rate * 1000) / 10;
  return [...new Set(drops)].flatMap((id) => {
    const specialty = specialties.get(id);
    if (!specialty) return [];
    const gain = specialtyTreasureGain(preview, id, content.areas, content.items);
    if (gain) preview.dex.items.push(id);
    return [
      {
        name: specialty.item.name,
        blurb: specialty.motif.blurb,
        powerText: gain
          ? t('field.specialtyPowerGain', {
              gain: percent(gain.gainRate),
              total: percent(gain.totalRate),
            })
          : undefined,
        completeText: gain?.complete ? t('field.specialtyAreaComplete', { area: gain.areaName }) : undefined,
      },
    ];
  });
}
