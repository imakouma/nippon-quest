import { useEffect, useMemo, useRef } from 'preact/hooks';
import { NQ } from '../../rendering/palette';
import { t } from '../i18n';
import { PixelIcon } from '../PixelIcon';
import { RubyLabel } from '../RubyLabel';
import { displayText } from '../ruby';
import { playSfx } from '../sfx';
import { useModalFocus } from '../useModalFocus';
import {
  buildNationalMapHighlight,
  buildNationalMapRaster,
  NATIONAL_MAP_SIZE,
  type NationalMapRaster,
} from './nationalMapGeometry';
import type { MapRegionInfo } from './worldMapModel';

const DOT = 2;
const RENDER_SIZE = NATIONAL_MAP_SIZE * DOT;

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

export function nationalRegionAt(raster: NationalMapRaster, x: number, y: number): number {
  const px = Math.floor(x);
  const py = Math.floor(y);
  if (px < 0 || py < 0 || px >= raster.width || py >= raster.height) return -1;
  const sourceIndex = raster.regionAt[py * raster.width + px] ?? -1;
  const sourceId = raster.sourceIds[sourceIndex];
  return JAPAN_GENERAL_REGIONS.findIndex((generalRegion) =>
    generalRegion.sourceIds.some((candidate) => candidate === sourceId),
  );
}

function drawJapanBase(
  canvas: HTMLCanvasElement,
  raster: NationalMapRaster,
  regions: readonly MapRegionInfo[],
  hereAreaId: string | undefined,
): void {
  canvas.width = RENDER_SIZE;
  canvas.height = RENDER_SIZE;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, RENDER_SIZE, RENDER_SIZE);
  for (let index = 0; index < raster.regionAt.length; index++) {
    const regionIndex = raster.regionAt[index]!;
    if (regionIndex < 0) continue;
    const areaIndex = raster.areaAt[index]!;
    const area = regions[regionIndex]?.areas[areaIndex];
    const x = index % raster.width;
    const y = Math.floor(index / raster.width);
    ctx.fillStyle = area?.id === hereAreaId ? NQ.cream : area?.visited ? NQ.leaf : NQ.slate;
    ctx.fillRect(x * DOT, y * DOT, DOT, DOT);
  }
  const keyAt = (x: number, y: number): number => {
    if (x < 0 || y < 0 || x >= raster.width || y >= raster.height) return -1;
    const index = y * raster.width + x;
    const regionIndex = raster.regionAt[index]!;
    return regionIndex < 0 ? -1 : regionIndex * 64 + raster.areaAt[index]!;
  };
  ctx.fillStyle = NQ.ink;
  for (let index = 0; index < raster.regionAt.length; index++) {
    if (raster.regionAt[index]! < 0) continue;
    const x = index % raster.width;
    const y = Math.floor(index / raster.width);
    const key = keyAt(x, y);
    const left = x * DOT;
    const top = y * DOT;
    if (keyAt(x - 1, y) !== key) ctx.fillRect(left, top, 1, DOT);
    if (keyAt(x + 1, y) !== key) ctx.fillRect(left + DOT - 1, top, 1, DOT);
    if (keyAt(x, y - 1) !== key) ctx.fillRect(left, top, DOT, 1);
    if (keyAt(x, y + 1) !== key) ctx.fillRect(left, top + DOT - 1, DOT, 1);
  }
}

function drawJapanHighlight(
  canvas: HTMLCanvasElement,
  raster: NationalMapRaster,
  selectedSourceIds: readonly string[],
): void {
  canvas.width = RENDER_SIZE;
  canvas.height = RENDER_SIZE;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, RENDER_SIZE, RENDER_SIZE);
  const highlight = buildNationalMapHighlight(raster, selectedSourceIds);
  for (let distance = 4; distance >= 1; distance--)
    for (let index = 0; index < highlight.glowDistance.length; index++) {
      if (highlight.glowDistance[index] !== distance) continue;
      const x = index % raster.width;
      const y = Math.floor(index / raster.width);
      if (distance === 4 && (x + y) % 3 !== 0) continue;
      if (distance === 3 && (x + y) % 2 !== 0) continue;
      ctx.fillStyle = distance === 1 ? NQ.yellow : distance === 2 ? NQ.gold : NQ.ochre;
      ctx.fillRect(x * DOT, y * DOT, DOT, DOT);
    }
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
  const mapCanvas = useRef<HTMLCanvasElement>(null);
  const highlightCanvas = useRef<HTMLCanvasElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  useModalFocus(dialogRef, '.nq-japan-region-list .nq-focus');
  const generalRegion = JAPAN_GENERAL_REGIONS[selectedGroup];
  const sourceRegions = generalRegion?.sourceIds
    .map((id) => regions.find((region) => region.id === id))
    .filter((region): region is MapRegionInfo => Boolean(region));
  const visited = sourceRegions?.flatMap((region) => region.areas).filter((area) => area.visited).length ?? 0;
  const total = sourceRegions?.reduce((sum, region) => sum + region.areas.length, 0) ?? 0;
  const raster = useMemo(() => buildNationalMapRaster(regions), [regions]);

  useEffect(() => {
    if (mapCanvas.current) drawJapanBase(mapCanvas.current, raster, regions, hereAreaId);
  }, [raster, regions, hereAreaId]);
  useEffect(() => {
    const selectedSourceIds = JAPAN_GENERAL_REGIONS[selectedGroup]?.sourceIds ?? [];
    if (highlightCanvas.current) drawJapanHighlight(highlightCanvas.current, raster, selectedSourceIds);
  }, [raster, selectedGroup]);
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
      raster,
      ((event.clientX - box.left) / box.width) * NATIONAL_MAP_SIZE,
      ((event.clientY - box.top) / box.height) * NATIONAL_MAP_SIZE,
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
            <canvas ref={mapCanvas} class="nq-japan-map" onClick={onMapClick} aria-hidden="true" />
            <canvas ref={highlightCanvas} class="nq-japan-highlight" aria-hidden="true" />
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
