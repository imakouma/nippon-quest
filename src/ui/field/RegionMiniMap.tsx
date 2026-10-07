import { useEffect, useLayoutEffect, useRef, useState } from 'preact/hooks';
import { NQ } from '../../rendering/palette';
import { areaAt, type RegionGrid } from './WorldMapOverlay';
import { areaMapTerrainColor } from './areaMapTerrain';

export interface RegionMiniView extends RegionGrid {
  id: string;
  visited: boolean[];
  here: number;
  hero: [number, number] | null;
  focus: [number, number, number, number] | null;
  detail: {
    key: string;
    tiles: readonly number[];
    width: number;
    land: [number, number, number, number];
  } | null;
}

const MINI = 2;
const MINI_ZOOM = 2;
const MINI_MAX_CELL = 24;

function drawDetail(canvas: HTMLCanvasElement, detail: NonNullable<RegionMiniView['detail']>): void {
  const [x0, y0, x1, y1] = detail.land;
  canvas.width = x1 - x0 + 1;
  canvas.height = y1 - y0 + 1;
  const ctx = canvas.getContext('2d')!;
  for (let y = y0; y <= y1; y++)
    for (let x = x0; x <= x1; x++) {
      const tile = detail.tiles[y * detail.width + x] ?? 3;
      if (tile === 3) continue;
      ctx.fillStyle = areaMapTerrainColor(tile);
      ctx.fillRect(x - x0, y - y0, 1, 1);
    }
}

function drawVisited(canvas: HTMLCanvasElement, region: RegionMiniView, cell: number): void {
  canvas.width = region.width * cell;
  canvas.height = region.height * cell;
  const ctx = canvas.getContext('2d')!;
  const fill = (x: number, y: number, width: number, height: number, color: string) => {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, width, height);
  };
  const open = (index: number) =>
    index >= 0 && !!region.visited[index] && !(region.detail && index === region.here);
  const edge = cell >= 8 ? 2 : 1;
  for (let y = 0; y < region.height; y++)
    for (let x = 0; x < region.width; x++) {
      const index = areaAt(region, x, y);
      if (!open(index)) continue;
      const left = x * cell;
      const top = y * cell;
      fill(left, top, cell, cell, index === region.here ? NQ.lime : NQ.leaf);
      const right = areaAt(region, x + 1, y);
      const down = areaAt(region, x, y + 1);
      if (right >= 0 && right !== index) fill(left + cell - edge, top, edge, cell, NQ.forest);
      if (down >= 0 && down !== index) fill(left, top + cell - edge, cell, edge, NQ.forest);
      if (areaAt(region, x - 1, y) < 0) fill(left, top, edge, cell, NQ.ink);
      if (right < 0) fill(left + cell - edge, top, edge, cell, NQ.ink);
      if (areaAt(region, x, y - 1) < 0) fill(left, top, cell, edge, NQ.ink);
      if (down < 0) fill(left, top + cell - edge, cell, edge, NQ.ink);
    }
}

/** HUD の左上に表示する、主人公を中心にした地方ミニ地図。 */
export function RegionMiniMap({
  region,
  label,
  onOpen,
}: {
  region: RegionMiniView;
  label: string;
  onOpen: () => void;
}) {
  const box = useRef<HTMLButtonElement>(null);
  const clear = useRef<HTMLCanvasElement>(null);
  const detail = useRef<HTMLCanvasElement>(null);
  const [[viewWidth, viewHeight], setSize] = useState<[number, number]>([216, 216]);
  useLayoutEffect(() => {
    const width = box.current?.clientWidth;
    const height = box.current?.clientHeight;
    if (width && height && (width !== viewWidth || height !== viewHeight)) setSize([width, height]);
  });
  const focus = region.focus;
  const cell = focus
    ? Math.max(
        MINI,
        Math.min(
          MINI_MAX_CELL,
          Math.floor(
            MINI_ZOOM *
              Math.min(viewWidth / (focus[2] - focus[0] + 3), viewHeight / (focus[3] - focus[1] + 3)),
          ),
        ),
      )
    : MINI;
  const opened = region.visited.map((visited) => (visited ? 1 : 0)).join('');
  const detailKey = region.detail?.key ?? '';
  useEffect(() => {
    if (clear.current) drawVisited(clear.current, region, cell);
  }, [region.id, opened, region.here, detailKey, cell]);
  useEffect(() => {
    if (detail.current && region.detail) drawDetail(detail.current, region.detail);
  }, [detailKey]);
  const [centerX, centerY] =
    region.hero ?? (focus ? [(focus[0] + focus[2] + 1) / 2, (focus[1] + focus[3] + 1) / 2] : [0, 0]);
  return (
    <button ref={box} type="button" class="nq-mini" aria-label={label} title={label} onClick={onOpen}>
      <div
        class="nq-mini-map"
        style={{
          width: region.width * cell,
          height: region.height * cell,
          left: Math.round(viewWidth / 2 - centerX * cell),
          top: Math.round(viewHeight / 2 - centerY * cell),
        }}
      >
        <canvas ref={clear} />
        {region.detail && focus && (
          <canvas
            ref={detail}
            class="nq-mini-detail"
            style={{
              left: focus[0] * cell,
              top: focus[1] * cell,
              width: (focus[2] - focus[0] + 1) * cell,
              height: (focus[3] - focus[1] + 1) * cell,
            }}
          />
        )}
      </div>
      {region.hero && <span class="nq-mini-hero" style={{ left: viewWidth / 2, top: viewHeight / 2 }} />}
    </button>
  );
}
