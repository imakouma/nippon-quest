import { useEffect, useLayoutEffect, useRef, useState } from 'preact/hooks';
import type { RegionGrid } from './worldMapModel';
import { areaMapTerrainColor } from './areaMapTerrain';
import { drawRegionContext } from './regionContext';

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
// 現在県だけで窓を埋めず、隣接県の暗いシルエットまで見せる。
const MINI_ZOOM = 1;
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
  const detailKey = region.detail?.key ?? '';
  useEffect(() => {
    if (clear.current) drawRegionContext(clear.current, region, cell);
  }, [region.id, region.here, cell]);
  useEffect(() => {
    if (detail.current && region.detail) drawDetail(detail.current, region.detail);
  }, [detailKey]);
  const [centerX, centerY] =
    region.hero ?? (focus ? [(focus[0] + focus[2] + 1) / 2, (focus[1] + focus[3] + 1) / 2] : [0, 0]);
  return (
    <button
      ref={box}
      type="button"
      class="nq-mini"
      aria-label={label}
      aria-keyshortcuts="M"
      title={label}
      onClick={onOpen}
    >
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
      <span class="nq-mini-open" aria-hidden="true">
        {label}
      </span>
    </button>
  );
}
