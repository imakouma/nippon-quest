import type { MenuHomeKey } from '../../shared/menuModel';
import { NQ } from '../../rendering/palette';

type Shape = readonly [x: number, y: number, width: number, height: number, color: string];
const rect = ([x, y, width, height, fill]: Shape, index: number) => (
  <rect key={index} x={x} y={y} width={width} height={height} fill={fill} />
);

const ICONS: Readonly<Record<MenuHomeKey, readonly Shape[]>> = {
  roadmap: [
    [1, 3, 6, 10, NQ.ink],
    [9, 3, 6, 10, NQ.ink],
    [2, 4, 5, 8, NQ.paper],
    [9, 4, 5, 8, NQ.paper],
    [3, 5, 3, 1, NQ.sky],
    [3, 8, 3, 1, NQ.sky],
    [10, 5, 3, 1, NQ.sky],
    [10, 8, 3, 1, NQ.sky],
    [7, 4, 2, 10, NQ.ink],
    [11, 1, 2, 4, NQ.gold],
    [10, 2, 4, 2, NQ.gold],
  ],
  mistakes: [
    [3, 1, 10, 14, NQ.ink],
    [4, 2, 8, 12, NQ.paper],
    [6, 0, 4, 3, NQ.slate],
    [5, 5, 2, 2, NQ.red],
    [9, 5, 2, 2, NQ.red],
    [7, 7, 2, 2, NQ.red],
    [5, 9, 2, 2, NQ.red],
    [9, 9, 2, 2, NQ.red],
    [11, 11, 4, 2, NQ.azure],
    [13, 10, 2, 2, NQ.gold],
  ],
  monsters: [
    [2, 4, 12, 10, NQ.ink],
    [3, 5, 10, 8, NQ.violet],
    [1, 2, 4, 4, NQ.ink],
    [11, 2, 4, 4, NQ.ink],
    [2, 3, 2, 2, NQ.gold],
    [12, 3, 2, 2, NQ.gold],
    [5, 7, 2, 2, NQ.white],
    [9, 7, 2, 2, NQ.white],
    [6, 11, 1, 2, NQ.white],
    [9, 11, 1, 2, NQ.white],
  ],
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
  party: [
    [4, 1, 8, 4, NQ.ink],
    [5, 2, 6, 3, NQ.tan],
    [2, 4, 12, 11, NQ.ink],
    [3, 5, 10, 9, NQ.orange],
    [4, 6, 8, 4, NQ.amber],
    [5, 7, 6, 2, NQ.gold],
    [2, 7, 2, 6, NQ.brown],
    [12, 7, 2, 6, NQ.brown],
    [7, 11, 2, 2, NQ.cream],
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

export function MenuCategoryIcon({ name }: { name: MenuHomeKey }) {
  return (
    <svg class="nq-menu-category-icon" viewBox="0 0 16 16" shape-rendering="crispEdges" aria-hidden="true">
      {ICONS[name].map(rect)}
    </svg>
  );
}
