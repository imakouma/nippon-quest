import { areaBossFlag, midBossFlag } from '../../core/progression/route';
import type { GameState } from '../../core/state/schema';
import type { DialogueLine } from '../../ui/dialogue';
import { t, tOpt } from '../../ui/i18n';

const STORY_AREAS = new Set([
  'aomori',
  'iwate',
  'miyagi',
  'akita',
  'yamagata',
  'fukushima',
  'hokkaido',
  'ibaraki',
  'tochigi',
  'gunma',
  'saitama',
  'chiba',
  'tokyo',
  'kanagawa',
  'niigata',
  'toyama',
  'ishikawa',
  'fukui',
  'yamanashi',
  'nagano',
  'gifu',
  'shizuoka',
  'aichi',
  'mie',
  'shiga',
  'kyoto',
  'osaka',
  'hyogo',
  'nara',
  'wakayama',
  'tottori',
  'shimane',
  'okayama',
  'hiroshima',
  'yamaguchi',
  'tokushima',
  'kagawa',
  'ehime',
  'kochi',
  'fukuoka',
  'saga',
  'nagasaki',
  'kumamoto',
  'oita',
  'miyazaki',
  'kagoshima',
  'okinawa',
]);
const HOKURIKU_AREAS = new Set(['niigata', 'toyama', 'ishikawa', 'fukui']);
const KOSHINETSU_AREAS = new Set(['yamanashi', 'nagano']);
const TOKAI_AREAS = new Set(['gifu', 'shizuoka', 'aichi', 'mie']);
const KINKI_AREAS = new Set(['shiga', 'kyoto', 'osaka', 'hyogo', 'nara', 'wakayama']);
const CHUGOKU_AREAS = new Set(['tottori', 'shimane', 'okayama', 'hiroshima', 'yamaguchi']);
const SHIKOKU_AREAS = new Set(['tokushima', 'kagawa', 'ehime', 'kochi']);
const KYUSHU_OKINAWA_AREAS = new Set([
  'fukuoka',
  'saga',
  'nagasaki',
  'kumamoto',
  'oita',
  'miyazaki',
  'kagoshima',
  'okinawa',
]);

type HaruPhase = 'arrival' | 'mid' | 'complete';

/** シオリの町会話を進行に合わせ、未攻略時のネタバレを防ぐ。 */
export function haruDialogue(npcKey: string, game: GameState): DialogueLine[] | null {
  const match = /^npc-([a-z0-9-]+)-haru$/.exec(npcKey);
  const areaId = match?.[1];
  if (!areaId || !STORY_AREAS.has(areaId)) return null;
  const done = new Set(game.progress.eventsDone);
  const phase: HaruPhase = done.has(areaBossFlag(areaId))
    ? 'complete'
    : done.has(midBossFlag(areaId))
      ? 'mid'
      : 'arrival';
  const base = `field.haruProgress.${areaId}.${phase}`;
  const group = KYUSHU_OKINAWA_AREAS.has(areaId)
    ? 'kyushuOkinawa'
    : SHIKOKU_AREAS.has(areaId)
      ? 'shikoku'
      : CHUGOKU_AREAS.has(areaId)
        ? 'chugoku'
        : KINKI_AREAS.has(areaId)
          ? 'kinki'
          : TOKAI_AREAS.has(areaId)
            ? 'tokai'
            : KOSHINETSU_AREAS.has(areaId)
              ? 'koshinetsu'
              : HOKURIKU_AREAS.has(areaId)
                ? 'hokuriku'
                : 'kanto';
  const fallback = `field.haruProgress.${group}.${phase}`;
  return [
    { speaker: t('field.storyHaru'), text: tOpt(`${base}.first`) ?? t(`${fallback}.first`) },
    { speaker: t('field.storyHaru'), text: tOpt(`${base}.second`) ?? t(`${fallback}.second`) },
  ];
}
