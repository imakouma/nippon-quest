/**
 * にほんちず：地方（島）ごとの地図。県ごとの進みぐあい（見つけた名所・中ボス）を見て、行ったことのある県のフィールドへ行ける
 * （まだの県は灰色で ワープできない。中ボスを倒して ワープホールから行く）。
 * 歩ける「地方マップ」の代わり。地図のドットは public/worldmap.json（scripts/scaffold-maps.ts が作る）。
 * 操作：←→ 地方 / ↑↓ 県 / Z・Enter 行く / X・Esc 閉じる。地図の県をタップしても選べる。
 * ロジックは持たない（進みぐあいは Overworld が計算して渡す）。見つけていない名所の名前は出さない。
 */
import { useEffect, useRef, useState } from 'preact/hooks';
import { NQ } from '../../scenes/art/palette';
import { t } from '../i18n';
import { PixelIcon } from '../PixelIcon';
import { RubyLabel } from '../RubyLabel';
import { playSfx } from '../sfx';
import './field.css';

/** public/worldmap.json の形 */
export interface WorldMapData {
  regions: {
    id: string;
    width: number;
    height: number;
    /** '.' は海、'a' + i は areas[i] の県 */
    rows: string[];
    areas: { id: string; capital: [number, number]; stamps: string[] }[];
  }[];
}

export interface MapAreaInfo {
  id: string;
  /** 県名（RubyText） */
  name: string;
  /** 県庁所在地のマス */
  capital: [number, number];
  /** フィールドの名所（★ 看板）と 特産品（宝箱）。見つけたものは名前（かな）、まだのものは null */
  stamps: { name: string | null; box: boolean }[];
  /** 中ボス：たおした / まだ / いない */
  boss: 'done' | 'yet' | 'none';
  /** 行ったことがある（ロック解除）。まだの県は灰色で、ワープできない */
  visited: boolean;
}

export interface MapRegionInfo {
  id: string;
  /** 地方（島）の名前（RubyText） */
  name: string;
  width: number;
  height: number;
  rows: string[];
  areas: MapAreaInfo[];
}

export interface WorldMapOverlayProps {
  regions: MapRegionInfo[];
  /** いまいる県。at は県の陸地の中でのだいたいの位置（左上 0 〜 右下 1）。無ければ県庁所在地に立つ */
  here: { areaId: string; at?: [number, number] } | null;
  onGo: (areaId: string) => void;
  onClose: () => void;
}

/** 地図の 1 マス = 4 ドット。CSS で ×2 して 1 ドット = 2px（フィールドと同じ大きさのドット） */
const DOT = 4;
const CELL = DOT * 2;

/** 地方の地図のマス目（にほんちず・左上の小さな地図で共通） */
export interface RegionGrid {
  width: number;
  height: number;
  /** '.' は海、'a' + i は areas[i] の県 */
  rows: string[];
  areas: { capital: [number, number] }[];
}

/** rows の 1 文字 → 県の番号（海は -1） */
export function areaAt(r: RegionGrid, x: number, y: number): number {
  const c = r.rows[y]?.[x];
  return c && c !== '.' ? c.charCodeAt(0) - 97 : -1;
}

function cellsOf(r: RegionGrid, k: number): [number, number][] {
  const out: [number, number][] = [];
  for (let y = 0; y < r.height; y++)
    for (let x = 0; x < r.width; x++) if (areaAt(r, x, y) === k) out.push([x, y]);
  return out;
}

function painter(canvas: HTMLCanvasElement, r: MapRegionInfo) {
  canvas.width = r.width * DOT;
  canvas.height = r.height * DOT;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  return (x: number, y: number, w: number, h: number, col: string) => {
    ctx.fillStyle = col;
    ctx.fillRect(x, y, w, h);
  };
}

/** 行ったことのある県の番号（未踏の県と海は -1。未踏の県は 海と おなじに かく） */
const seenAt = (r: MapRegionInfo, x: number, y: number): number => {
  const k = areaAt(r, x, y);
  return k >= 0 && r.areas[k]?.visited ? k : -1;
};

/** 海（波）→ 県（中ボスを倒した県は明るい緑）→ 県境 → 海岸線 → 県庁所在地。未踏の県は かかない（海に見える） */
function drawRegion(canvas: HTMLCanvasElement, r: MapRegionInfo): void {
  const px = painter(canvas, r);
  const areaAt = seenAt;
  for (let y = 0; y < r.height; y++)
    for (let x = 0; x < r.width; x++) {
      const X = x * DOT;
      const Y = y * DOT;
      const k = areaAt(r, x, y);
      if (k < 0) {
        px(X, Y, DOT, DOT, NQ.azure);
        if ((x * 7 + y * 3) % 13 === 0) px(X, Y + 1, 2, 1, NQ.sky);
        continue;
      }
      const a = r.areas[k];
      px(X, Y, DOT, DOT, a?.boss === 'done' ? NQ.lime : NQ.leaf);
      const right = areaAt(r, x + 1, y);
      const down = areaAt(r, x, y + 1);
      if (right >= 0 && right !== k) px(X + DOT - 1, Y, 1, DOT, NQ.forest);
      if (down >= 0 && down !== k) px(X, Y + DOT - 1, DOT, 1, NQ.forest);
      if (areaAt(r, x - 1, y) < 0) px(X, Y, 1, DOT, NQ.ink);
      if (right < 0) px(X + DOT - 1, Y, 1, DOT, NQ.ink);
      if (areaAt(r, x, y - 1) < 0) px(X, Y, DOT, 1, NQ.ink);
      if (down < 0) px(X, Y + DOT - 1, DOT, 1, NQ.ink);
    }
  for (const a of r.areas) if (a.visited) px(a.capital[0] * DOT + 1, a.capital[1] * DOT + 1, 2, 2, NQ.red);
}

/** えらんでいる県を明るくぬる（CSS で点滅させる） */
function drawSelection(canvas: HTMLCanvasElement, r: MapRegionInfo, k: number): void {
  const px = painter(canvas, r);
  // 未踏の県は 形も 出さない
  if (!r.areas[k]?.visited) return;
  for (const [x, y] of cellsOf(r, k)) px(x * DOT, y * DOT, DOT, DOT, NQ.cream);
  const cap = r.areas[k]?.capital;
  if (cap) px(cap[0] * DOT + 1, cap[1] * DOT + 1, 2, 2, NQ.red);
}

/** 主人公が立つマス：県の外わくの中の at の位置に、いちばん近いその県のマス */
export function heroCell(r: RegionGrid, k: number, at?: [number, number]): [number, number] {
  const cells = cellsOf(r, k);
  if (!at || !cells.length) return r.areas[k]!.capital;
  const xs = cells.map((c) => c[0]);
  const ys = cells.map((c) => c[1]);
  const x0 = Math.min(...xs);
  const y0 = Math.min(...ys);
  const tx = x0 + at[0] * (Math.max(...xs) - x0 + 1);
  const ty = y0 + at[1] * (Math.max(...ys) - y0 + 1);
  let best = cells[0]!;
  let bd = Infinity;
  for (const c of cells) {
    const d = (c[0] + 0.5 - tx) ** 2 + (c[1] + 0.5 - ty) ** 2;
    if (d < bd) {
      bd = d;
      best = c;
    }
  }
  return best;
}

/** 地図の上のしるし（主人公・王冠）は、マスのまん中に足もとが来るように置く */
const pinAt = ([x, y]: [number, number]) => ({ left: x * CELL + CELL / 2, top: y * CELL + CELL / 2 });

export function WorldMapOverlay({ regions, here, onGo, onClose }: WorldMapOverlayProps) {
  const home = Math.max(
    0,
    regions.findIndex((r) => r.areas.some((a) => a.id === here?.areaId)),
  );
  const [ri, setRi] = useState(home);
  const [ai, setAi] = useState(() =>
    Math.max(0, regions[home]?.areas.findIndex((a) => a.id === here?.areaId) ?? 0),
  );
  const region = regions[ri];
  const area = region?.areas[ai];
  const base = useRef<HTMLCanvasElement>(null);
  const sel = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (base.current && region) drawRegion(base.current, region);
  }, [region]);
  useEffect(() => {
    if (sel.current && region) drawSelection(sel.current, region, ai);
  }, [region, ai]);

  const pickRegion = (d: number) => {
    const n = regions.length;
    if (n < 2) return;
    const next = (ri + d + n) % n;
    playSfx('move');
    setRi(next);
    setAi(
      Math.max(
        0,
        regions[next]!.areas.findIndex((a) => a.id === here?.areaId),
      ),
    );
  };
  const pickArea = (k: number) => {
    if (k === ai || !region?.areas[k]) return;
    playSfx('move');
    setAi(k);
  };
  const go = () => {
    // 行ったことのない県へは ワープできない（中ボスを倒して ワープホールから行く）
    if (!area?.visited) {
      playSfx('miss');
      return;
    }
    playSfx('select');
    onGo(area.id);
  };

  const live = useRef({ pickRegion, pickArea, go, onClose, ai, n: 0 });
  live.current = { pickRegion, pickArea, go, onClose, ai, n: region?.areas.length ?? 0 };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const L = live.current;
      switch (e.key) {
        case 'ArrowLeft':
          L.pickRegion(-1);
          break;
        case 'ArrowRight':
          L.pickRegion(1);
          break;
        case 'ArrowUp':
          if (L.n) L.pickArea((L.ai - 1 + L.n) % L.n);
          break;
        case 'ArrowDown':
          if (L.n) L.pickArea((L.ai + 1) % L.n);
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

  /** 地図をタップ：そのマスの県をえらぶ（#ui-layer は拡大縮小されているので、見た目の大きさで割りもどす） */
  const onMapClick = (e: MouseEvent) => {
    const el = e.currentTarget as HTMLElement;
    const box = el.getBoundingClientRect();
    const x = Math.floor(((e.clientX - box.left) * el.offsetWidth) / box.width / CELL);
    const y = Math.floor(((e.clientY - box.top) * el.offsetHeight) / box.height / CELL);
    if (region) pickArea(areaAt(region, x, y));
  };

  const hereK = region ? region.areas.findIndex((a) => a.id === here?.areaId) : -1;
  const found = area ? area.stamps.filter((s) => s.name !== null).length : 0;

  return (
    <div class="nq-wmap" onClick={onClose}>
      <div class="nq-win nq-wmap-box" onClick={(e) => e.stopPropagation()}>
        <div class="nq-wmap-left">
          <div class="nq-wmap-region">
            <button type="button" class="nq-wmap-arrow" onClick={() => pickRegion(-1)}>
              ◀
            </button>
            <RubyLabel text={region?.name ?? ''} class="nq-wmap-rname" />
            <button type="button" class="nq-wmap-arrow" onClick={() => pickRegion(1)}>
              ▶
            </button>
          </div>
          <div class="nq-wmap-view">
            {region && (
              <div
                class="nq-wmap-canvas"
                style={{ width: region.width * CELL, height: region.height * CELL }}
                onClick={onMapClick}
              >
                <canvas ref={base} />
                <canvas ref={sel} class="nq-wmap-sel" />
                {region.areas.map(
                  (a) =>
                    a.boss === 'done' && (
                      <span key={a.id} class="nq-wmap-pin" style={pinAt(a.capital)}>
                        <PixelIcon name="boss" scale={2} />
                      </span>
                    ),
                )}
                {hereK >= 0 && (
                  <span class="nq-wmap-pin nq-wmap-hero" style={pinAt(heroCell(region, hereK, here?.at))}>
                    <PixelIcon name="hero" scale={2} />
                  </span>
                )}
              </div>
            )}
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
          {area ? (
            <div class="nq-wmap-info">
              <div class="nq-wmap-aname-row">
                <RubyLabel text={area.visited ? area.name : t('field.dexUnknown')} class="nq-wmap-aname" />
                {area.id === here?.areaId && (
                  <span class="nq-wmap-here">
                    <PixelIcon name="hero" scale={2} />
                    {t('field.mapHere')}
                  </span>
                )}
              </div>
              {!area.visited && <p class="nq-wmap-locked">{t('field.mapLocked')}</p>}
              {area.boss !== 'none' && (
                <p class="nq-wmap-row">
                  <PixelIcon name="boss" scale={3} />
                  {t('field.mapBoss')}
                  <span class={area.boss === 'done' ? 'nq-wmap-ok' : 'nq-wmap-yet'}>
                    {t(area.boss === 'done' ? 'field.mapBossDone' : 'field.mapBossYet')}
                  </span>
                </p>
              )}
              <p class="nq-wmap-row">
                <PixelIcon name="star" scale={3} />
                {t('field.mapStamps')}
                <span class="nq-wmap-ok">
                  {found}/{area.stamps.length}
                </span>
              </p>
              <ul class="nq-wmap-stamps">
                {area.stamps.map((s, i) => (
                  <li key={i} class={s.name === null ? 'nq-wmap-yet' : ''}>
                    <PixelIcon name={s.box ? 'chest' : s.name === null ? 'star-off' : 'star'} scale={2} />
                    {s.name ?? t('field.mapUnknown')}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p class="nq-wmap-info">{t('field.mapMissing')}</p>
          )}
          <div class="nq-wmap-foot">
            <button type="button" class="nq-opt nq-wmap-go" disabled={!area?.visited} onClick={go}>
              <PixelIcon name="warp" scale={3} />
              {t('field.mapGo')}
            </button>
            <span class="nq-wmap-keys">{t('field.mapKeys')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
