import type { MenuHomeKey } from '../../shared/menuModel';
import { NQ } from '../../rendering/palette';

import roadmap from './menu-icons/roadmap.png';
import mistakes from './menu-icons/mistakes.png';
import monsters from './menu-icons/monsters.png';
import party from './menu-icons/party.png';
import skills from './menu-icons/skills.png';
import settings from './menu-icons/settings.png';
import save from './menu-icons/save.png';

const DRAWER_ICONS: Partial<Record<MenuHomeKey | 'save', string>> = {
  roadmap,
  mistakes,
  monsters,
  party,
  skills,
  settings,
  save,
};

type Shape = readonly [x: number, y: number, width: number, height: number, color: string];
const rect = ([x, y, width, height, fill]: Shape, index: number) => (
  <rect key={index} x={x} y={y} width={width} height={height} fill={fill} />
);

const FALLBACK_ICONS: Partial<Record<MenuHomeKey, readonly Shape[]>> = {
  specialties: [
    [1, 5, 14, 3, NQ.ink],
    [2, 6, 12, 8, NQ.vermilion],
    [7, 6, 2, 8, NQ.gold],
    [1, 4, 14, 3, NQ.gold],
    [7, 4, 2, 3, NQ.red],
    [3, 1, 4, 3, NQ.ink],
    [4, 2, 3, 2, NQ.red],
    [9, 1, 4, 3, NQ.ink],
    [9, 2, 3, 2, NQ.red],
  ],
  bag: [
    [2, 7, 6, 7, NQ.ink],
    [3, 8, 4, 5, NQ.red],
    [3, 6, 4, 3, NQ.ink],
    [4, 5, 2, 2, NQ.white],
    [9, 4, 5, 10, NQ.ink],
    [10, 5, 3, 8, NQ.sky],
    [10, 3, 3, 3, NQ.paper],
    [11, 7, 1, 3, NQ.white],
  ],
  equip: [
    [2, 2, 4, 4, NQ.silver],
    [1, 1, 6, 2, NQ.ink],
    [5, 4, 2, 11, NQ.ink],
    [6, 5, 2, 9, NQ.brown],
    [10, 1, 3, 10, NQ.cloud],
    [9, 2, 5, 2, NQ.ink],
    [8, 10, 7, 2, NQ.ink],
    [11, 11, 2, 4, NQ.brown],
  ],
};

export function MenuCategoryIcon({ name }: { name: MenuHomeKey | 'save' }) {
  const src = DRAWER_ICONS[name];
  if (src) return <img class="nq-menu-category-icon" src={src} width={32} height={32} alt="" />;
  if (name === 'save') return null;

  return (
    <svg class="nq-menu-category-icon" viewBox="0 0 16 16" shape-rendering="crispEdges" aria-hidden="true">
      {FALLBACK_ICONS[name]?.map(rect)}
    </svg>
  );
}
