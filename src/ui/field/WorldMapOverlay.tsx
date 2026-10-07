/**
 * にほんちず：地方（島）ごとの地図。県ごとの進みぐあい（見つけた名所・中ボス）を見て、行ったことのある県のフィールドへ行ける
 * （まだの県は灰色で ワープできない。中ボスを倒して ワープホールから行く）。
 * 歩ける「地方マップ」の代わり。地図のドットは public/worldmap.json（scripts/scaffold-maps.ts が作る）。
 * 操作：←→ 地方 / ↑↓ 県 / Z・Enter 行く / X・Esc 閉じる。地図の県をタップしても選べる。
 * ロジックは持たない（進みぐあいは Overworld が計算して渡す）。見つけていない名所の名前は出さない。
 */
import { useEffect, useRef, useState } from 'preact/hooks';
import { NQ } from '../../rendering/palette';
import { t } from '../i18n';
import { PixelIcon } from '../PixelIcon';
import { RubyLabel } from '../RubyLabel';
import { playSfx } from '../sfx';
import { JapanMapOverview } from './JapanMapOverview';
import { areaAt, type MapRegionInfo, type RegionGrid } from './worldMapModel';
import './field.css';

export interface WorldMapOverlayProps {
  regions: MapRegionInfo[];
  /** いまいる県。at は県の陸地の中でのだいたいの位置（左上 0 〜 右下 1）。無ければ県庁所在地に立つ */
  here: { areaId: string; at?: [number, number] } | null;
  onGo: (areaId: string) => void;
  onChallengeIslandBoss: (islandId: string) => void;
  onClose: () => void;
}

/** 地図の 1 マス = 4 ドット。CSS で ×2 して 1 ドット = 2px（フィールドと同じ大きさのドット） */
const DOT = 4;
const CELL = DOT * 2;
const MAP_INNER = 400;

/** 高解像度の地方図も 400px の枠へ整数倍で収め、ドット絵をぼかさない。 */
export const regionDisplayCell = (r: Pick<RegionGrid, 'width' | 'height'>): number =>
  Math.max(1, Math.min(CELL, Math.floor(MAP_INNER / Math.max(r.width, r.height))));

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
const pinAt = ([x, y]: [number, number], cell = CELL) => ({
  left: x * cell + cell / 2,
  top: y * cell + cell / 2,
});

/** 県庁所在地の印と重なりにくい陸地を、地方ボスの城の位置にする。 */
export function islandBossCell(r: RegionGrid): [number, number] {
  const cells = r.areas.flatMap((_area, index) => cellsOf(r, index));
  if (!cells.length) return [Math.floor(r.width / 2), Math.floor(r.height / 2)];
  return cells.reduce((best, cell) => {
    const nearest = (point: [number, number]) =>
      Math.min(
        ...r.areas.map((area) => (area.capital[0] - point[0]) ** 2 + (area.capital[1] - point[1]) ** 2),
      );
    return nearest(cell) > nearest(best) ? cell : best;
  }, cells[0]!);
}

function RegionWorldMapOverlay({
  regions,
  here,
  onGo,
  onChallengeIslandBoss,
  onClose,
  initialRegion,
  onBack,
}: WorldMapOverlayProps & { initialRegion: number; onBack: () => void }) {
  const home = Math.max(0, initialRegion);
  const [ri, setRi] = useState(home);
  const [ai, setAi] = useState(() =>
    Math.max(0, regions[home]?.areas.findIndex((a) => a.id === here?.areaId) ?? 0),
  );
  const region = regions[ri];
  const cell = region ? regionDisplayCell(region) : CELL;
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
    if (region?.status !== 'playable' || !area?.visited) {
      playSfx('miss');
      return;
    }
    playSfx('select');
    onGo(area.id);
  };
  const challengeIslandBoss = () => {
    if (!region || region.islandBoss.state !== 'ready') {
      playSfx('miss');
      return;
    }
    playSfx('select');
    onChallengeIslandBoss(region.id);
  };
  const activate = () => {
    if (region?.islandBoss.state === 'ready') challengeIslandBoss();
    else go();
  };

  const live = useRef({ pickRegion, pickArea, activate, onBack, ai, n: 0 });
  live.current = { pickRegion, pickArea, activate, onBack, ai, n: region?.areas.length ?? 0 };
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
          L.activate();
          break;
        case 'Escape':
        case 'x':
        case 'X':
          L.onBack();
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
    const x = Math.floor(((e.clientX - box.left) * el.offsetWidth) / box.width / cell);
    const y = Math.floor(((e.clientY - box.top) * el.offsetHeight) / box.height / cell);
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
                style={{ width: region.width * cell, height: region.height * cell }}
                onClick={onMapClick}
              >
                <canvas ref={base} />
                <canvas ref={sel} class="nq-wmap-sel" />
                {region.areas.map(
                  (a) =>
                    a.boss === 'done' && (
                      <span key={a.id} class="nq-wmap-pin" style={pinAt(a.capital, cell)}>
                        <PixelIcon name="boss" scale={2} />
                      </span>
                    ),
                )}
                {region.status === 'playable' && region.islandBoss.state !== 'locked' && (
                  <button
                    type="button"
                    class={`nq-wmap-castle nq-wmap-castle-${region.islandBoss.state}`}
                    style={pinAt(islandBossCell(region), cell)}
                    disabled={region.islandBoss.state !== 'ready'}
                    aria-label={t(
                      region.islandBoss.state === 'done'
                        ? 'field.mapIslandBossDoneLabel'
                        : region.islandBoss.state === 'ready'
                          ? 'field.mapIslandBossReadyLabel'
                          : 'field.mapIslandBossLockedLabel',
                      { name: region.islandBoss.name },
                    )}
                    onClick={(event) => {
                      event.stopPropagation();
                      challengeIslandBoss();
                    }}
                  >
                    <PixelIcon name="dungeon" scale={3} />
                  </button>
                )}
                {hereK >= 0 && (
                  <span
                    class="nq-wmap-pin nq-wmap-hero"
                    style={pinAt(heroCell(region, hereK, here?.at), cell)}
                  >
                    <PixelIcon name="hero" scale={2} />
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        <div class="nq-wmap-right">
          <div class="nq-wmap-head">
            <button type="button" class="nq-back nq-wmap-national-back" onClick={onBack}>
              ← {t('field.mapNationBack')}
            </button>
            <span class="nq-wmap-title">
              <PixelIcon name="map" scale={3} />
              {t('field.worldMap')}
            </span>
            <button type="button" class="nq-back" onClick={onClose}>
              × {t('ui.close')}
            </button>
          </div>
          {region?.status === 'stub' ? (
            <div class="nq-wmap-info nq-wmap-barrier">
              <PixelIcon name="gate" scale={6} />
              <RubyLabel text={region.name} class="nq-wmap-aname" />
              <p>{t('field.mapIslandBarrier')}</p>
            </div>
          ) : area ? (
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
              {region?.islandBoss.state !== 'locked' && (
                <div class={`nq-wmap-island-boss nq-wmap-island-boss-${region.islandBoss.state}`}>
                  <PixelIcon name="dungeon" scale={3} />
                  <span>
                    {t('field.mapIslandBoss')}: {region.islandBoss.name}
                  </span>
                  <strong>
                    {t(`field.mapIslandBoss${region.islandBoss.state === 'done' ? 'Done' : 'Ready'}`, {
                      found: region.islandBoss.foundSigns,
                      required: region.islandBoss.requiredSigns,
                    })}
                  </strong>
                </div>
              )}
            </div>
          ) : (
            <p class="nq-wmap-info">{t('field.mapMissing')}</p>
          )}
          <div class="nq-wmap-foot">
            {region?.islandBoss.state === 'ready' ? (
              <button type="button" class="nq-opt nq-wmap-go" onClick={challengeIslandBoss}>
                <PixelIcon name="dungeon" scale={3} />
                {t('field.mapIslandBossChallenge')}
              </button>
            ) : (
              <button
                type="button"
                class="nq-opt nq-wmap-go"
                disabled={region?.status !== 'playable' || !area?.visited}
                onClick={go}
              >
                <PixelIcon name="warp" scale={3} />
                {t('field.mapGo')}
              </button>
            )}
            <span class="nq-wmap-keys">{t('field.mapKeys')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function WorldMapOverlay(props: WorldMapOverlayProps) {
  const home = Math.max(
    0,
    props.regions.findIndex((region) => region.areas.some((area) => area.id === props.here?.areaId)),
  );
  const [overview, setOverview] = useState(true);
  const [selectedRegion, setSelectedRegion] = useState(home);
  if (overview)
    return (
      <JapanMapOverview
        regions={props.regions}
        hereAreaId={props.here?.areaId}
        selected={selectedRegion}
        onSelect={setSelectedRegion}
        onOpen={() => setOverview(false)}
        onClose={props.onClose}
      />
    );
  return <RegionWorldMapOverlay {...props} initialRegion={selectedRegion} onBack={() => setOverview(true)} />;
}
