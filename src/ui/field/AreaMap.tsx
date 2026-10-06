/**
 * 地図の部品。左上の小さな地図（HUD の場所の窓の中）と、ひらいたときの県の大きな地図。
 *  - 小さな地図：いまいる地方（島）を、主人公を まん中に いまいる県が ちょうど入るくらいに拡大して。
 *    行ったことのある県だけ はっきり、ほかの県は ぼかす
 *  - 大きな地図：県のフィールドの全体（入口・★ 看板・中ボスは「？」）と、「いったことの ある ばしょ」
 *    （町・ダンジョン・島・見つけた名所）。えらんでワープできる
 * ロジックは持たない（何を描くか・どこへ行けるかは Overworld が計算して渡す）。
 * 操作：↑↓ えらぶ / Z・Enter ワープ / X・Esc・M とじる。地図のしるしをタップしても選べる。
 */
import { useEffect, useRef, useState } from 'preact/hooks';
import { NQ } from '../../rendering/palette';
import { t } from '../i18n';
import { PixelIcon } from '../PixelIcon';
import { RubyLabel } from '../RubyLabel';
import { playSfx } from '../sfx';
import { areaAt } from './WorldMapOverlay';
import { areaMapTerrainColor } from './areaMapTerrain';
import type { RegionMiniView } from './RegionMiniMap';
import './field.css';

export type AreaMarkKind =
  | 'town'
  | 'dungeon'
  | 'ship'
  | 'boss'
  | 'warp'
  | 'sign-off'
  | 'sign-todo'
  | 'sign-done'
  /** 特産品の宝箱（あけたら うすく） */
  | 'box'
  | 'box-open';

export interface AreaMark {
  x: number;
  y: number;
  kind: AreaMarkKind;
}

export interface AreaMapView {
  /** マップのキー（地形の絵をかき直すかどうかの目じるし） */
  key: string;
  width: number;
  height: number;
  /** background レイヤーのタイル番号（scripts/scaffold-maps.ts の TILE） */
  tiles: readonly number[];
  marks: AreaMark[];
  /** 主人公のマス（町・ダンジョンの中にいるときは、その入口） */
  hero: [number, number] | null;
  /** 県のまわりの地方の地図（行ったことのある県は緑、未踏の県は灰色）。県のフィールドの地形の下に かさねる */
  region: RegionMiniView | null;
}

export interface PlaceOption {
  id: string;
  /** 場所の名前（RubyText） */
  name: string;
  icon: string;
  /** 地図の上の位置（この地図に無い場所は null） */
  at: [number, number] | null;
}

/** 大きな地図の枠の内側（.nq-wmap-view と同じ 400px） */
/** 県マップは見出しと操作バーを含めて540pxの画面内に収める。 */
const AREA_VIEW = 344;

/**
 * 地形を 1 マス = 1 ドットでかく（CSS で整数倍に広げる）。
 * 海（3）は かかない（枠の青が見える。県の外の陸は海の色なので、下に かさねた地方の地図のとなりの県が見える）
 */
function drawTerrain(canvas: HTMLCanvasElement, map: AreaMapView): void {
  canvas.width = map.width;
  canvas.height = map.height;
  const ctx = canvas.getContext('2d')!;
  for (let y = 0; y < map.height; y++)
    for (let x = 0; x < map.width; x++) {
      const tile = map.tiles[y * map.width + x] ?? 0;
      if (tile === 3) continue;
      ctx.fillStyle = areaMapTerrainColor(tile);
      ctx.fillRect(x, y, 1, 1);
    }
}

/**
 * ひらいた地図の、県のまわりの地方の地図（1 マス = 1 ドット。CSS で県の範囲に合わせて のばす）。
 * 行ったことのある県だけ緑で かく（未踏の県は かかず、海と おなじに 見える）。いまいる県は フィールドの地形で かくので かかない
 */
function drawRegionGray(canvas: HTMLCanvasElement, r: RegionMiniView): void {
  canvas.width = r.width;
  canvas.height = r.height;
  const ctx = canvas.getContext('2d')!;
  for (let y = 0; y < r.height; y++)
    for (let x = 0; x < r.width; x++) {
      const k = areaAt(r, x, y);
      if (k < 0 || k === r.here || !r.visited[k]) continue;
      ctx.fillStyle = NQ.leaf;
      ctx.fillRect(x, y, 1, 1);
    }
}

const cellCenter = (x: number, y: number, cell: number) => ({
  left: x * cell + cell / 2,
  top: y * cell + cell / 2,
});

function useTerrain(map: AreaMapView) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (ref.current) drawTerrain(ref.current, map);
  }, [map.key]);
  return ref;
}

function MarkIcon({ kind }: { kind: AreaMarkKind }) {
  if (kind === 'sign-off') return <PixelIcon name="star-off" scale={2} />;
  if (kind === 'sign-todo')
    return (
      <span class="nq-amap-todo">
        <PixelIcon name="star" scale={2} />
      </span>
    );
  if (kind === 'sign-done') return <PixelIcon name="star" scale={2} />;
  if (kind === 'box') return <PixelIcon name="chest" scale={2} />;
  if (kind === 'box-open')
    return (
      <span style={{ opacity: 0.45 }}>
        <PixelIcon name="chest" scale={2} />
      </span>
    );
  // 中ボスは「？」（だれがいるかは行ってみるまでわからない）
  if (kind === 'boss') return <span class="nq-amap-boss">？</span>;
  return <PixelIcon name={kind} scale={2} />;
}

export interface AreaMapOverlayProps {
  map: AreaMapView;
  /** 地図の名前（RubyText） */
  title: string;
  places: PlaceOption[];
  onGo: (id: string) => void;
  /** にほんちず（ほかの県へ）を ひらく。左上の地図から えらべるように */
  worldLabel: string;
  onWorldMap: () => void;
  onClose: () => void;
}

/** ひらいた地図：地図の全体と「いったことの ある ばしょ」。えらんだ場所へワープする。にほんちずへも ここから */
export function AreaMapOverlay({
  map,
  title,
  places,
  onGo,
  worldLabel,
  onWorldMap,
  onClose,
}: AreaMapOverlayProps) {
  const cell = Math.max(2, Math.floor(Math.min(AREA_VIEW / map.width, AREA_VIEW / map.height)));
  const mapWidth = map.width * cell;
  const mapHeight = map.height * cell;
  const ref = useTerrain(map);
  const [sel, setSel] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const place = places[sel];
  const drag = useRef({ pointerId: -1, x: 0, y: 0, panX: 0, panY: 0, moved: false });
  const view = useRef({ zoom, pan });
  view.current = { zoom, pan };
  const gesture = useRef({
    pointers: new Map<number, { x: number; y: number }>(),
    distance: 0,
    zoom: 1,
    centerX: 0,
    centerY: 0,
    panX: 0,
    panY: 0,
  });

  const clampPan = (next: { x: number; y: number }, atZoom = zoom) => {
    const maxX = Math.max(0, (mapWidth * atZoom - AREA_VIEW) / 2);
    const maxY = Math.max(0, (mapHeight * atZoom - AREA_VIEW) / 2);
    return {
      x: Math.max(-maxX, Math.min(maxX, next.x)),
      y: Math.max(-maxY, Math.min(maxY, next.y)),
    };
  };
  const changeZoom = (next: number) => {
    const level = Math.max(1, Math.min(3, next));
    playSfx('move');
    setZoom(level);
    setPan((current) => clampPan(current, level));
  };
  const zoomAt = (next: number, x: number, y: number) => {
    const current = view.current;
    const level = Math.max(1, Math.min(3, next));
    if (level === current.zoom) return;
    const ratio = level / current.zoom;
    const focused = {
      x: x - AREA_VIEW / 2,
      y: y - AREA_VIEW / 2,
    };
    const nextPan = clampPan(
      {
        x: focused.x - (focused.x - current.pan.x) * ratio,
        y: focused.y - (focused.y - current.pan.y) * ratio,
      },
      level,
    );
    view.current = { zoom: level, pan: nextPan };
    setZoom(level);
    setPan(nextPan);
  };
  const resetView = () => {
    playSfx('move');
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // 県のまわりの地方の地図：いまいる県の範囲（地方のマス focus）が、フィールドの陸の範囲（land）に重なるように のばす
  const regionRef = useRef<HTMLCanvasElement>(null);
  const r = map.region;
  const f = r?.focus;
  const land = r?.detail?.land;
  const regionBox =
    r && f && land
      ? (() => {
          const sx = (land[2] - land[0] + 1) / (f[2] - f[0] + 1);
          const sy = (land[3] - land[1] + 1) / (f[3] - f[1] + 1);
          return {
            left: (land[0] - f[0] * sx) * cell,
            top: (land[1] - f[1] * sy) * cell,
            width: r.width * sx * cell,
            height: r.height * sy * cell,
          };
        })()
      : null;
  useEffect(() => {
    if (regionRef.current && r) drawRegionGray(regionRef.current, r);
  }, [r?.id]);

  const pick = (k: number) => {
    if (k === sel || !places[k]) return;
    playSfx('move');
    setSel(k);
  };
  const go = () => {
    if (!place) return;
    playSfx('select');
    onGo(place.id);
  };

  const live = useRef({ pick, go, onClose, sel, n: places.length });
  live.current = { pick, go, onClose, sel, n: places.length };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const L = live.current;
      switch (e.key) {
        case 'ArrowUp':
          if (L.n) L.pick((L.sel - 1 + L.n) % L.n);
          break;
        case 'ArrowDown':
          if (L.n) L.pick((L.sel + 1) % L.n);
          break;
        case 'Enter':
        case ' ':
        case 'z':
        case 'Z':
          L.go();
          break;
        case 'Escape':
        case 'x':
        case 'X':
        case 'm':
        case 'M':
          L.onClose();
          break;
        default:
          return;
      }
      e.preventDefault();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  /** 地図をタップ：いちばん近い場所（2 マス以内）をえらぶ。#ui-layer は拡大縮小されているので見た目の大きさで割りもどす */
  const onMapClick = (e: MouseEvent) => {
    if (drag.current.moved) {
      drag.current.moved = false;
      return;
    }
    const el = e.currentTarget as HTMLElement;
    const box = el.getBoundingClientRect();
    const x = ((e.clientX - box.left) * el.offsetWidth) / box.width / cell;
    const y = ((e.clientY - box.top) * el.offsetHeight) / box.height / cell;
    let best = -1;
    let bd = 2.5 ** 2;
    places.forEach((p, k) => {
      if (!p.at) return;
      const d = (p.at[0] + 0.5 - x) ** 2 + (p.at[1] + 0.5 - y) ** 2;
      if (d < bd) {
        bd = d;
        best = k;
      }
    });
    if (best >= 0) pick(best);
  };

  const onMapPointerDown = (e: PointerEvent) => {
    if (e.button !== 0) return;
    const el = e.currentTarget as HTMLElement;
    el.setPointerCapture(e.pointerId);
    const points = gesture.current.pointers;
    points.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (points.size === 2) {
      const [a, b] = [...points.values()];
      if (!a || !b) return;
      gesture.current.distance = Math.hypot(a.x - b.x, a.y - b.y);
      gesture.current.zoom = view.current.zoom;
      gesture.current.centerX = (a.x + b.x) / 2;
      gesture.current.centerY = (a.y + b.y) / 2;
      gesture.current.panX = view.current.pan.x;
      gesture.current.panY = view.current.pan.y;
      drag.current.moved = true;
      return;
    }
    drag.current = {
      pointerId: e.pointerId,
      x: e.clientX,
      y: e.clientY,
      panX: pan.x,
      panY: pan.y,
      moved: false,
    };
  };
  const onMapPointerMove = (e: PointerEvent) => {
    const points = gesture.current.pointers;
    if (!points.has(e.pointerId)) return;
    points.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (points.size >= 2) {
      const [a, b] = [...points.values()];
      if (!a || !b || gesture.current.distance <= 0) return;
      const el = e.currentTarget as HTMLElement;
      const box = el.getBoundingClientRect();
      const scaleX = el.offsetWidth / box.width;
      const scaleY = el.offsetHeight / box.height;
      const centerX = (a.x + b.x) / 2;
      const centerY = (a.y + b.y) / 2;
      const level = Math.max(
        1,
        Math.min(3, gesture.current.zoom * (Math.hypot(a.x - b.x, a.y - b.y) / gesture.current.distance)),
      );
      const nextPan = clampPan(
        {
          x: gesture.current.panX + (centerX - gesture.current.centerX) * scaleX,
          y: gesture.current.panY + (centerY - gesture.current.centerY) * scaleY,
        },
        level,
      );
      view.current = { zoom: level, pan: nextPan };
      setZoom(level);
      setPan(nextPan);
      drag.current.moved = true;
      return;
    }
    const start = drag.current;
    if (start.pointerId !== e.pointerId) return;
    const el = e.currentTarget as HTMLElement;
    const box = el.getBoundingClientRect();
    const scaleX = el.offsetWidth / box.width;
    const scaleY = el.offsetHeight / box.height;
    const dx = (e.clientX - start.x) * scaleX;
    const dy = (e.clientY - start.y) * scaleY;
    if (Math.abs(dx) + Math.abs(dy) > 4) start.moved = true;
    setPan(clampPan({ x: start.panX + dx, y: start.panY + dy }));
  };
  const onMapPointerUp = (e: PointerEvent) => {
    const points = gesture.current.pointers;
    points.delete(e.pointerId);
    if (points.size === 1) {
      const [pointerId, point] = [...points.entries()][0] ?? [];
      if (pointerId !== undefined && point) {
        drag.current = {
          pointerId,
          x: point.x,
          y: point.y,
          panX: view.current.pan.x,
          panY: view.current.pan.y,
          moved: true,
        };
      }
      return;
    }
    if (drag.current.pointerId === e.pointerId || points.size === 0) drag.current.pointerId = -1;
  };
  const onMapWheel = (e: WheelEvent) => {
    e.preventDefault();
    const el = e.currentTarget as HTMLElement;
    const box = el.getBoundingClientRect();
    const scaleX = el.offsetWidth / box.width;
    const scaleY = el.offsetHeight / box.height;
    const isPinch = e.ctrlKey || e.metaKey;
    const isMouseWheel = !isPinch && Math.abs(e.deltaX) < 1 && Math.abs(e.deltaY) >= 50;
    if (isPinch || isMouseWheel) {
      const amount = isPinch ? -e.deltaY * 0.005 : e.deltaY < 0 ? 0.5 : -0.5;
      zoomAt(view.current.zoom + amount, (e.clientX - box.left) * scaleX, (e.clientY - box.top) * scaleY);
      return;
    }
    const nextPan = clampPan({
      x: view.current.pan.x - e.deltaX * scaleX,
      y: view.current.pan.y - e.deltaY * scaleY,
    });
    view.current = { zoom: view.current.zoom, pan: nextPan };
    setPan(nextPan);
    drag.current.moved = true;
  };

  return (
    <div class="nq-wmap" onClick={onClose}>
      <div class="nq-win nq-wmap-box" onClick={(e) => e.stopPropagation()}>
        <div class="nq-wmap-left">
          <div class="nq-wmap-region">
            <RubyLabel text={title} class="nq-wmap-rname" />
            <button type="button" class="nq-opt nq-amap-world" onClick={onWorldMap}>
              <PixelIcon name="map" scale={2} />
              {worldLabel}
            </button>
          </div>
          <div class="nq-amap-tools">
            <div class="nq-amap-zoom-group">
              <button
                type="button"
                class="nq-wmap-arrow"
                aria-label={t('field.areaMapZoomOut')}
                disabled={zoom === 1}
                onClick={() => changeZoom(zoom - 0.5)}
              >
                −
              </button>
              <span class="nq-amap-zoom-value" aria-live="polite">
                {Math.round(zoom * 100)}%
              </span>
              <button
                type="button"
                class="nq-wmap-arrow"
                aria-label={t('field.areaMapZoomIn')}
                disabled={zoom === 3}
                onClick={() => changeZoom(zoom + 0.5)}
              >
                ＋
              </button>
              <button type="button" class="nq-opt nq-amap-reset" onClick={resetView}>
                {t('field.areaMapReset')}
              </button>
            </div>
            {regionBox && <span class="nq-amap-legend">{t('field.areaMapLegend')}</span>}
          </div>
          <div
            class={`nq-wmap-view nq-amap-view ${zoom > 1 ? 'nq-amap-pannable' : ''}`}
            onPointerDown={onMapPointerDown}
            onPointerMove={onMapPointerMove}
            onPointerUp={onMapPointerUp}
            onPointerCancel={onMapPointerUp}
            onWheel={onMapWheel}
          >
            <div
              class="nq-wmap-canvas"
              style={{
                width: mapWidth,
                height: mapHeight,
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              }}
              onClick={onMapClick}
            >
              {regionBox && <canvas ref={regionRef} class="nq-amap-region" style={regionBox} />}
              <canvas ref={ref} />
              {map.marks.map((m, i) => (
                <span key={i} class="nq-amap-pin" style={cellCenter(m.x, m.y, cell)}>
                  <MarkIcon kind={m.kind} />
                </span>
              ))}
              {place?.at && <span class="nq-amap-sel" style={cellCenter(place.at[0], place.at[1], cell)} />}
              {map.hero && (
                <span class="nq-wmap-pin nq-wmap-hero" style={cellCenter(map.hero[0], map.hero[1], cell)}>
                  <PixelIcon name="hero" scale={2} />
                </span>
              )}
            </div>
          </div>
          {zoom > 1 && <span class="nq-amap-pan-hint">{t('field.areaMapPanHint')}</span>}
        </div>

        <div class="nq-wmap-right">
          <div class="nq-wmap-head">
            <span class="nq-wmap-title">
              <PixelIcon name="warp" scale={3} />
              {t('field.places')}
            </span>
            <button type="button" class="nq-back" onClick={onClose}>
              × {t('ui.close')}
            </button>
          </div>
          <div class="nq-wmap-info">
            {places.length ? (
              <ul class="nq-amap-list">
                {places.map((p, k) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      class={`nq-opt ${k === sel ? 'nq-focus' : ''}`}
                      onPointerEnter={() => pick(k)}
                      onClick={() => (k === sel ? go() : pick(k))}
                    >
                      <span class="nq-amap-cur">{k === sel && <span class="nq-heart">♥</span>}</span>
                      <PixelIcon name={p.icon} scale={2} />
                      <RubyLabel text={p.name} class="nq-opt-name" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p class="nq-amap-empty">{t('field.placesEmpty')}</p>
            )}
          </div>
          <div class="nq-wmap-foot">
            <button type="button" class="nq-opt nq-wmap-go" disabled={!place} onClick={go}>
              <PixelIcon name="warp" scale={3} />
              {t('field.placeGo')}
            </button>
            <span class="nq-wmap-keys">{t('field.areaMapKeys')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
