import { useEffect, useRef } from 'preact/hooks';
import { NQ } from '../../rendering/palette';
import { t } from '../i18n';
import { PixelIcon } from '../PixelIcon';
import { RubyLabel } from '../RubyLabel';
import { displayText } from '../ruby';
import { playSfx } from '../sfx';
import { useModalFocus } from '../useModalFocus';
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

export const JAPAN_GENERAL_REGIONS = [
  { id: 'hokkaido', nameKey: 'field.mapRegionHokkaido', sourceIds: ['hokkaido'] },
  { id: 'tohoku', nameKey: 'field.mapRegionTohoku', sourceIds: ['tohoku'] },
  { id: 'kanto', nameKey: 'field.mapRegionKanto', sourceIds: ['kanto'] },
  {
    id: 'chubu',
    nameKey: 'field.mapRegionChubu',
    sourceIds: ['hokuriku', 'koshinetsu', 'tokai'],
  },
  { id: 'kinki', nameKey: 'field.mapRegionKinki', sourceIds: ['kinki'] },
  { id: 'chugoku', nameKey: 'field.mapRegionChugoku', sourceIds: ['chugoku'] },
  { id: 'shikoku', nameKey: 'field.mapRegionShikoku', sourceIds: ['shikoku'] },
  {
    id: 'kyushu-okinawa',
    nameKey: 'field.mapRegionKyushuOkinawa',
    sourceIds: ['kyushu-okinawa'],
  },
] as const;

export function nationalRegionAt(x: number, y: number): number {
  return JAPAN_GENERAL_REGIONS.findIndex((generalRegion) =>
    generalRegion.sourceIds.some((sourceId) => {
      const box = JAPAN_REGION_LAYOUT[sourceId];
      return box && x >= box.x && y >= box.y && x < box.x + box.w && y < box.y + box.h;
    }),
  );
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
  selectedGroup: number,
  hereAreaId: string | undefined,
): void {
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, SIZE, SIZE);
  regions.forEach((region) => {
    const box = JAPAN_REGION_LAYOUT[region.id];
    if (!box) return;
    ctx.drawImage(regionImage(region, hereAreaId), box.x, box.y, box.w, box.h);
  });
  const boxes = JAPAN_GENERAL_REGIONS[selectedGroup]?.sourceIds
    .map((id) => JAPAN_REGION_LAYOUT[id])
    .filter((box): box is { x: number; y: number; w: number; h: number } => Boolean(box));
  if (!boxes?.length) return;
  const x = Math.min(...boxes.map((box) => box.x));
  const y = Math.min(...boxes.map((box) => box.y));
  const right = Math.max(...boxes.map((box) => box.x + box.w));
  const bottom = Math.max(...boxes.map((box) => box.y + box.h));
  ctx.strokeStyle = NQ.yellow;
  ctx.lineWidth = 2;
  ctx.strokeRect(x - 1, y - 1, right - x + 2, bottom - y + 2);
}

export interface JapanMapOverviewProps {
  regions: MapRegionInfo[];
  hereAreaId?: string;
  selectedGroup: number;
  onSelectGroup: (index: number) => void;
  onOpen: (sourceRegionIndex: number) => void;
  onClose: () => void;
}

export function JapanMapOverview({
  regions,
  hereAreaId,
  selectedGroup,
  onSelectGroup,
  onOpen,
  onClose,
}: JapanMapOverviewProps) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  useModalFocus(dialogRef, '.nq-japan-region-list .nq-focus');
  const generalRegion = JAPAN_GENERAL_REGIONS[selectedGroup];
  const sourceRegions = generalRegion?.sourceIds
    .map((id) => regions.find((region) => region.id === id))
    .filter((region): region is MapRegionInfo => Boolean(region));
  const visited = sourceRegions?.flatMap((region) => region.areas).filter((area) => area.visited).length ?? 0;
  const total = sourceRegions?.reduce((sum, region) => sum + region.areas.length, 0) ?? 0;

  useEffect(() => {
    if (canvas.current) drawJapan(canvas.current, regions, selectedGroup, hereAreaId);
  }, [regions, selectedGroup, hereAreaId]);
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      dialogRef.current?.querySelector<HTMLElement>('.nq-japan-region-list .nq-focus')?.focus();
    });
    return () => cancelAnimationFrame(frame);
  }, [selectedGroup]);

  const pick = (index: number) => {
    if (!JAPAN_GENERAL_REGIONS[index] || index === selectedGroup) return;
    playSfx('move');
    onSelectGroup(index);
  };
  const openDefault = () => {
    const source =
      sourceRegions?.find((region) => region.areas.some((area) => area.id === hereAreaId)) ??
      sourceRegions?.[0];
    const index = source ? regions.indexOf(source) : -1;
    if (index >= 0) onOpen(index);
  };
  const live = useRef({
    selected: selectedGroup,
    count: JAPAN_GENERAL_REGIONS.length,
    pick,
    openDefault,
    onClose,
  });
  live.current = { selected: selectedGroup, count: JAPAN_GENERAL_REGIONS.length, pick, openDefault, onClose };
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const inControl =
        event.target instanceof HTMLElement &&
        event.target.closest('button, input, select, textarea, [contenteditable="true"]');
      if (inControl && (event.key === 'Enter' || event.key === ' ')) return;
      const state = live.current;
      if (event.key === 'ArrowLeft' || event.key === 'ArrowUp')
        state.pick((state.selected - 1 + state.count) % state.count);
      else if (event.key === 'ArrowRight' || event.key === 'ArrowDown')
        state.pick((state.selected + 1) % state.count);
      else if (['Enter', ' ', 'z', 'Z'].includes(event.key)) state.openDefault();
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
      ((event.clientX - box.left) / box.width) * SIZE,
      ((event.clientY - box.top) / box.height) * SIZE,
    );
    if (index < 0) return;
    if (index === selectedGroup) openDefault();
    else pick(index);
  };

  return (
    <div
      ref={dialogRef}
      class="nq-wmap"
      role="dialog"
      aria-modal="true"
      aria-label={displayText(t('field.mapNationTitle'))}
      onClick={onClose}
    >
      <div class="nq-win nq-wmap-box" onClick={(event) => event.stopPropagation()}>
        <div class="nq-wmap-left">
          <div class="nq-wmap-region nq-japan-heading">
            <RubyLabel text={t('field.mapNationTitle')} class="nq-wmap-rname" />
          </div>
          <div class="nq-wmap-view nq-japan-view">
            <canvas ref={canvas} onClick={onMapClick} aria-hidden="true" />
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
            <RubyLabel text={generalRegion ? t(generalRegion.nameKey) : ''} class="nq-wmap-aname" />
            <p>{t('field.mapNationPrefectures', { visited, total })}</p>
            <div class="nq-japan-region-list">
              {JAPAN_GENERAL_REGIONS.map((candidate, index) => (
                <button
                  key={candidate.id}
                  type="button"
                  class={`nq-opt ${index === selectedGroup ? 'nq-focus' : ''}`}
                  aria-pressed={index === selectedGroup}
                  onClick={() => (index === selectedGroup ? openDefault() : pick(index))}
                >
                  <RubyLabel text={t(candidate.nameKey)} />
                </button>
              ))}
            </div>
          </div>
          <div class="nq-wmap-foot nq-japan-foot">
            <div class="nq-japan-detail-buttons">
              {sourceRegions?.map((source) => (
                <button
                  key={source.id}
                  type="button"
                  class="nq-opt nq-wmap-go"
                  onClick={() => onOpen(regions.indexOf(source))}
                >
                  <PixelIcon name="map" scale={2} />
                  {sourceRegions.length > 1 ? (
                    <RubyLabel text={source.name} />
                  ) : (
                    t('field.mapNationOpenRegion')
                  )}
                </button>
              ))}
            </div>
            <span class="nq-wmap-keys">{t('field.mapNationKeys')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
