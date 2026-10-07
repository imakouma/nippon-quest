import { useEffect, useRef } from 'preact/hooks';
import { NQ } from '../../rendering/palette';
import { t } from '../i18n';
import { PixelIcon } from '../PixelIcon';
import { RubyLabel } from '../RubyLabel';
import { playSfx } from '../sfx';
import type { MapRegionInfo } from './worldMapModel';

const SIZE = 200;
const areaAt = (region: MapRegionInfo, x: number, y: number): number => {
  const cell = region.rows[y]?.[x];
  return cell && cell !== '.' ? cell.charCodeAt(0) - 97 : -1;
};

export const JAPAN_REGION_LAYOUT: Readonly<Record<string, { x: number; y: number; w: number; h: number }>> = {
  hokkaido: { x: 145, y: 2, w: 50, h: 44 },
  tohoku: { x: 142, y: 43, w: 32, h: 63 },
  kanto: { x: 142, y: 101, w: 52, h: 53 },
  koshinetsu: { x: 111, y: 88, w: 38, h: 47 },
  hokuriku: { x: 82, y: 91, w: 50, h: 44 },
  tokai: { x: 108, y: 129, w: 52, h: 49 },
  kinki: { x: 75, y: 127, w: 44, h: 52 },
  chugoku: { x: 29, y: 130, w: 58, h: 36 },
  shikoku: { x: 51, y: 164, w: 54, h: 31 },
  'kyushu-okinawa': { x: 3, y: 149, w: 40, h: 48 },
};

export function nationalRegionAt(regions: readonly MapRegionInfo[], x: number, y: number): number {
  return regions.findIndex((region) => {
    const box = JAPAN_REGION_LAYOUT[region.id];
    return box && x >= box.x && y >= box.y && x < box.x + box.w && y < box.y + box.h;
  });
}

function regionImage(region: MapRegionInfo, hereAreaId: string | undefined): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = region.width;
  canvas.height = region.height;
  const ctx = canvas.getContext('2d')!;
  for (let y = 0; y < region.height; y++)
    for (let x = 0; x < region.width; x++) {
      const areaIndex = areaAt(region, x, y);
      if (areaIndex < 0) continue;
      const area = region.areas[areaIndex];
      ctx.fillStyle = area?.id === hereAreaId ? NQ.cream : area?.visited ? NQ.leaf : NQ.slate;
      ctx.fillRect(x, y, 1, 1);
      ctx.fillStyle = NQ.ink;
      if (
        areaAt(region, x - 1, y) !== areaIndex ||
        areaAt(region, x + 1, y) !== areaIndex ||
        areaAt(region, x, y - 1) !== areaIndex ||
        areaAt(region, x, y + 1) !== areaIndex
      )
        ctx.fillRect(x, y, 1, 1);
    }
  return canvas;
}

function drawJapan(
  canvas: HTMLCanvasElement,
  regions: readonly MapRegionInfo[],
  selected: number,
  hereAreaId: string | undefined,
): void {
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, SIZE, SIZE);
  regions.forEach((region, index) => {
    const box = JAPAN_REGION_LAYOUT[region.id];
    if (!box) return;
    ctx.drawImage(regionImage(region, hereAreaId), box.x, box.y, box.w, box.h);
    if (index === selected) {
      ctx.strokeStyle = NQ.yellow;
      ctx.lineWidth = 2;
      ctx.strokeRect(box.x - 1, box.y - 1, box.w + 2, box.h + 2);
    }
  });
}

export interface JapanMapOverviewProps {
  regions: MapRegionInfo[];
  hereAreaId?: string;
  selected: number;
  onSelect: (index: number) => void;
  onOpen: () => void;
  onClose: () => void;
}

export function JapanMapOverview({
  regions,
  hereAreaId,
  selected,
  onSelect,
  onOpen,
  onClose,
}: JapanMapOverviewProps) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const region = regions[selected];
  const visited = region?.areas.filter((area) => area.visited).length ?? 0;

  useEffect(() => {
    if (canvas.current) drawJapan(canvas.current, regions, selected, hereAreaId);
  }, [regions, selected, hereAreaId]);

  const pick = (index: number) => {
    if (!regions[index] || index === selected) return;
    playSfx('move');
    onSelect(index);
  };
  const live = useRef({ selected, count: regions.length, pick, onOpen, onClose });
  live.current = { selected, count: regions.length, pick, onOpen, onClose };
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const state = live.current;
      if (event.key === 'ArrowLeft' || event.key === 'ArrowUp')
        state.pick((state.selected - 1 + state.count) % state.count);
      else if (event.key === 'ArrowRight' || event.key === 'ArrowDown')
        state.pick((state.selected + 1) % state.count);
      else if (['Enter', ' ', 'z', 'Z'].includes(event.key)) state.onOpen();
      else if (['Escape', 'x', 'X'].includes(event.key)) state.onClose();
      else return;
      event.preventDefault();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const onMapClick = (event: MouseEvent) => {
    const element = event.currentTarget as HTMLCanvasElement;
    const box = element.getBoundingClientRect();
    const index = nationalRegionAt(
      regions,
      ((event.clientX - box.left) / box.width) * SIZE,
      ((event.clientY - box.top) / box.height) * SIZE,
    );
    if (index < 0) return;
    if (index === selected) onOpen();
    else pick(index);
  };

  return (
    <div class="nq-wmap" onClick={onClose}>
      <div class="nq-win nq-wmap-box" onClick={(event) => event.stopPropagation()}>
        <div class="nq-wmap-left">
          <div class="nq-wmap-region nq-japan-heading">
            <RubyLabel text={t('field.mapNationTitle')} class="nq-wmap-rname" />
          </div>
          <div class="nq-wmap-view nq-japan-view">
            <canvas ref={canvas} onClick={onMapClick} aria-label={t('field.mapNationTitle')} />
          </div>
        </div>
        <div class="nq-wmap-right">
          <div class="nq-wmap-head">
            <span class="nq-wmap-title">
              <PixelIcon name="map" scale={3} />
              {t('field.worldMap')}
            </span>
            <button type="button" class="nq-back" onClick={onClose}>
              × {t('ui.close')}
            </button>
          </div>
          <div class="nq-wmap-info nq-japan-info">
            <RubyLabel text={region?.name ?? ''} class="nq-wmap-aname" />
            <p>{t('field.mapNationPrefectures', { visited, total: region?.areas.length ?? 0 })}</p>
            <div class="nq-japan-region-list">
              {regions.map((candidate, index) => (
                <button
                  key={candidate.id}
                  type="button"
                  class={`nq-opt ${index === selected ? 'nq-focus' : ''}`}
                  onClick={() => pick(index)}
                >
                  <RubyLabel text={candidate.name} />
                </button>
              ))}
            </div>
          </div>
          <div class="nq-wmap-foot">
            <button type="button" class="nq-opt nq-wmap-go" onClick={onOpen}>
              <PixelIcon name="map" scale={3} />
              {t('field.mapNationOpenRegion')}
            </button>
            <span class="nq-wmap-keys">{t('field.mapNationKeys')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
