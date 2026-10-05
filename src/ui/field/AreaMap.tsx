/**
 * 地図の部品。左上の小さな地図（HUD の場所の窓の中）と、ひらいたときの県の大きな地図。
 *  - 小さな地図：いまいる地方（島）を、主人公を まん中に いまいる県が ちょうど入るくらいに拡大して。
 *    行ったことのある県だけ はっきり、ほかの県は ぼかす
 *  - 大きな地図：県のフィールドの全体（入口・★ 看板・中ボスは「？」）と、「いったことの ある ばしょ」
 *    （町・ダンジョン・島・見つけた名所）。えらんでワープできる
 * ロジックは持たない（何を描くか・どこへ行けるかは Overworld が計算して渡す）。
 * 操作：↑↓ えらぶ / Z・Enter ワープ / X・Esc・M とじる。地図のしるしをタップしても選べる。
 */
import { useEffect, useLayoutEffect, useRef, useState } from 'preact/hooks';
import { NQ } from '../../scenes/art/palette';
import { t } from '../i18n';
import { PixelIcon } from '../PixelIcon';
import { RubyLabel } from '../RubyLabel';
import { playSfx } from '../sfx';
import { areaAt, type RegionGrid } from './WorldMapOverlay';
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

/** タイル番号 → 地図の色（フィールドの 見た目 src/scenes/overworld/viewTiles.ts と 同じ 色み。ほかは 草の 色） */
const TILE_COLOR: Record<number, string> = {
  2: NQ.sand,
  3: NQ.azure,
  4: NQ.green,
  5: NQ.beige,
  11: NQ.forest,
  12: NQ.tan,
  // 地面の 性質（src/core/world/ground.ts）：すなはま・もり・やま・みずべ・たはた・果樹園
  147: NQ.beige,
  148: NQ.beige,
  149: NQ.forest,
  150: NQ.forest,
  151: NQ.tan,
  152: NQ.tan,
  153: NQ.aqua,
  154: NQ.aqua,
  155: NQ.lime,
  156: NQ.sprout,
  157: NQ.green,
  158: NQ.green,
  // 都会の 町（src/scenes/overworld/townTiles.ts の 161〜220）：道路は 灰、歩道・ビルは うすい 灰、広場は 石の 色
  161: NQ.slate,
  162: NQ.slate,
  163: NQ.slate,
  164: NQ.slate,
  165: NQ.slate,
  166: NQ.gray,
  167: NQ.gray,
  168: NQ.beige,
  169: NQ.beige,
  181: NQ.slate,
  182: NQ.slate,
  183: NQ.silver,
  216: NQ.gray,
  217: NQ.silver,
  218: NQ.slate,
  219: NQ.leaf,
  // ダンジョンの テーマの 床（src/scenes/overworld/dungeonTiles.ts）：鍾乳洞・鉱山・火口・渓谷・お城・やしき・竹林・海の 洞くつ
  221: NQ.beige,
  222: NQ.sky,
  225: NQ.bark,
  226: NQ.silver,
  229: NQ.night,
  230: NQ.vermilion,
  233: NQ.slate,
  234: NQ.azure,
  237: NQ.sand,
  238: NQ.sprout,
  241: NQ.sprout,
  242: NQ.brown,
  245: NQ.tan,
  246: NQ.tan,
  249: NQ.teal,
  250: NQ.aqua,
};

/** 左上の小さな地図（地方）の 1 マスの最小（px）。ふつうは いまいる県が入る大きさに拡大する */
const MINI = 2;
/** 大きな地図の枠の内側（.nq-wmap-view と同じ 400px） */
const VIEW = 400;

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
      ctx.fillStyle = TILE_COLOR[tile] ?? NQ.leaf;
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

/** 左上の小さな地図の中身：いまいる地方（島）の県。行ったことのある県だけ かく（未踏の県は 海と おなじ） */
export interface RegionMiniView extends RegionGrid {
  /** 地方の id（地形をかき直すかどうかの目じるし） */
  id: string;
  /** areas[i] の県に行ったことがあるか（ロック解除） */
  visited: boolean[];
  /** いまいる県の番号（-1 なら無し） */
  here: number;
  /** 主人公の位置（マス単位・小数）。地図はここを まん中にする */
  hero: [number, number] | null;
  /** いまいる県のマスの範囲 [x0, y0, x1, y1]。この県が ちょうど入る大きさに拡大する */
  focus: [number, number, number, number] | null;
  /**
   * いまいる県を、フィールドの細かい地形で かく（拡大すると地方のマスはカクカクなので）。
   * land は フィールドの陸のタイルの範囲 [x0, y0, x1, y1]。これを focus の範囲に のばして重ねる
   */
  detail: {
    key: string;
    tiles: readonly number[];
    width: number;
    land: [number, number, number, number];
  } | null;
}

/** 拡大の倍率：いまいる県が ちょうど入る大きさの 2 倍（県の半分くらいが見える） */
const MINI_ZOOM = 2;

/** いまいる県の細かい地形（陸だけ。海は透明）。1 タイル = 1 ドットで かいて、CSS で focus の範囲に のばす */
function drawDetail(canvas: HTMLCanvasElement, d: NonNullable<RegionMiniView['detail']>): void {
  const [x0, y0, x1, y1] = d.land;
  canvas.width = x1 - x0 + 1;
  canvas.height = y1 - y0 + 1;
  const ctx = canvas.getContext('2d')!;
  for (let y = y0; y <= y1; y++)
    for (let x = x0; x <= x1; x++) {
      const tile = d.tiles[y * d.width + x] ?? 3;
      if (tile === 3) continue;
      ctx.fillStyle = TILE_COLOR[tile] ?? NQ.leaf;
      ctx.fillRect(x - x0, y - y0, 1, 1);
    }
}

/** はっきりの層：行ったことのある県だけ。いまいる県は明るく、県境と海岸線も */
function drawVisited(canvas: HTMLCanvasElement, r: RegionMiniView, cell: number): void {
  canvas.width = r.width * cell;
  canvas.height = r.height * cell;
  const ctx = canvas.getContext('2d')!;
  const px = (x: number, y: number, w: number, h: number, col: string) => {
    ctx.fillStyle = col;
    ctx.fillRect(x, y, w, h);
  };
  // いまいる県は細かい地形（detail）で かくので、ここでは かかない
  const open = (k: number) => k >= 0 && !!r.visited[k] && !(r.detail && k === r.here);
  /** 県境・海岸線の太さ（拡大しているときは 2px） */
  const t = cell >= 8 ? 2 : 1;
  for (let y = 0; y < r.height; y++)
    for (let x = 0; x < r.width; x++) {
      const k = areaAt(r, x, y);
      if (!open(k)) continue;
      const X = x * cell;
      const Y = y * cell;
      px(X, Y, cell, cell, k === r.here ? NQ.lime : NQ.leaf);
      const right = areaAt(r, x + 1, y);
      const down = areaAt(r, x, y + 1);
      if (right >= 0 && right !== k) px(X + cell - t, Y, t, cell, NQ.forest);
      if (down >= 0 && down !== k) px(X, Y + cell - t, cell, t, NQ.forest);
      if (areaAt(r, x - 1, y) < 0) px(X, Y, t, cell, NQ.ink);
      if (right < 0) px(X + cell - t, Y, t, cell, NQ.ink);
      if (areaAt(r, x, y - 1) < 0) px(X, Y, cell, t, NQ.ink);
      if (down < 0) px(X, Y + cell - t, cell, t, NQ.ink);
    }
}

/** 拡大しすぎない（1 マスの最大 px）。地図は場所の窓の幅いっぱいの正方形（CSS の aspect-ratio） */
const MINI_MAX_CELL = 24;

/** 左上の小さな地図：主人公を まん中に、いまいる県が ちょうど入るくらいに拡大。タップで県の大きな地図をひらく */
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
  const det = useRef<HTMLCanvasElement>(null);
  // 窓の幅いっぱいの正方形。主人公を まん中に置くため、実際の幅・高さを測る
  const [[vw, vh], setSize] = useState<[number, number]>([216, 216]);
  useLayoutEffect(() => {
    const w = box.current?.clientWidth;
    const h = box.current?.clientHeight;
    if (w && h && (w !== vw || h !== vh)) setSize([w, h]);
  });
  const f = region.focus;
  const cell = f
    ? Math.max(
        MINI,
        Math.min(
          MINI_MAX_CELL,
          Math.floor(MINI_ZOOM * Math.min(vw / (f[2] - f[0] + 3), vh / (f[3] - f[1] + 3))),
        ),
      )
    : MINI;
  const opened = region.visited.map((v) => (v ? 1 : 0)).join('');
  const detailKey = region.detail?.key ?? '';
  useEffect(() => {
    if (clear.current) drawVisited(clear.current, region, cell);
  }, [region.id, opened, region.here, detailKey, cell]);
  useEffect(() => {
    if (det.current && region.detail) drawDetail(det.current, region.detail);
  }, [detailKey]);
  const [cx, cy] = region.hero ?? (f ? [(f[0] + f[2] + 1) / 2, (f[1] + f[3] + 1) / 2] : [0, 0]);
  return (
    <button ref={box} type="button" class="nq-mini" aria-label={label} title={label} onClick={onOpen}>
      <div
        class="nq-mini-map"
        style={{
          width: region.width * cell,
          height: region.height * cell,
          left: Math.round(vw / 2 - cx * cell),
          top: Math.round(vh / 2 - cy * cell),
        }}
      >
        <canvas ref={clear} />
        {region.detail && f && (
          <canvas
            ref={det}
            class="nq-mini-detail"
            style={{
              left: f[0] * cell,
              top: f[1] * cell,
              width: (f[2] - f[0] + 1) * cell,
              height: (f[3] - f[1] + 1) * cell,
            }}
          />
        )}
      </div>
      {region.hero && <span class="nq-mini-hero" style={{ left: vw / 2, top: vh / 2 }} />}
    </button>
  );
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
  const cell = Math.max(2, Math.floor(Math.min(VIEW / map.width, VIEW / map.height)));
  const ref = useTerrain(map);
  const [sel, setSel] = useState(0);
  const place = places[sel];

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
          {regionBox && <span class="nq-amap-legend">{t('field.areaMapLegend')}</span>}
          <div class="nq-wmap-view nq-amap-view">
            <div
              class="nq-wmap-canvas"
              style={{ width: map.width * cell, height: map.height * cell }}
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
