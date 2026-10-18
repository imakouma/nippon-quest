import type { World } from '../../core/content/schemas';
import {
  interPrefectureAccess,
  interPrefectureUnlockRule,
  type LinkUnlockProgress,
} from '../../core/progression/interPrefecture';
import type { DialogueLine } from '../../ui/dialogue';
import { t } from '../../ui/i18n';
import { playSfx } from '../../ui/sfx';
import { interPrefectureDestinationSpawn, type InterPrefectureLink } from './interPrefectureLink';
import { presentInterPrefectureTravel } from './interPrefectureTravelFlow';

export function storyInterPrefectureLink(
  world: World,
  links: Iterable<InterPrefectureLink>,
  completedAreaId: string,
): InterPrefectureLink | null {
  for (const link of links) {
    const rule = interPrefectureUnlockRule(world, link);
    if (rule.kind === 'story' && rule.completedAreaId === completedAreaId) return link;
  }
  return null;
}

export const interPrefectureIsOpen = (
  world: World,
  link: InterPrefectureLink,
  progress: LinkUnlockProgress,
  devAll: boolean,
): boolean => interPrefectureAccess(world, link, progress, devAll).open;

interface InterPrefectureInteraction {
  world: World;
  link: InterPrefectureLink;
  progress: LinkUnlockProgress & { counters: Readonly<Record<string, number>> };
  devAll: boolean;
  areas: ReadonlyMap<string, { name: string }>;
  travelRoot: HTMLElement;
  talk(lines: DialogueLine[]): Promise<void>;
}

export interface InterPrefectureDestination {
  targetMap: string;
  targetSpawn: string;
}

/** 閉門理由・陸上横断・実在交通確認を一つの決定論的な入口フローにする。 */
export async function interactWithInterPrefectureLink(
  input: InterPrefectureInteraction,
): Promise<InterPrefectureDestination | null> {
  const access = interPrefectureAccess(input.world, input.link, input.progress, input.devAll);
  const areaName = (id: string) => input.areas.get(id)?.name ?? id;
  const islandName = (id: string) => input.world.islands.find((island) => island.id === id)?.name ?? id;
  const destination = areaName(input.link.targetArea);
  if (!access.open) {
    const requirements = [
      ...access.missingAreas.map(areaName),
      ...access.missingIslands.map(islandName),
    ].join('・');
    playSfx('miss');
    await input.talk([
      {
        speaker: t('field.gateSpeaker'),
        text: t('field.interPrefecture.locked', { to: destination, by: requirements }),
      },
    ]);
    return null;
  }

  playSfx(input.link.infrastructure === 'landBorder' ? 'select' : 'warp');
  if (input.link.infrastructure === 'landBorder')
    await input.talk([{ text: t('field.interPrefecture.cross', { to: destination }) }]);
  else if (!(await presentInterPrefectureTravel(input.travelRoot, input.link, t))) return null;
  const targetSpawn = interPrefectureDestinationSpawn(input.link, input.progress, input.devAll);
  if (targetSpawn === input.link.firstTargetSpawn && targetSpawn !== input.link.targetSpawn)
    await input.talk([{ text: t('field.interPrefecture.firstArrivalTransfer', { to: destination }) }]);
  return {
    targetMap: input.link.targetMap,
    targetSpawn,
  };
}
