/**
 * フィールドの DOM 部品：いまいる場所の窓（HUD）、移動したときの場所の名前、名所のカットイン。
 * ロジックは持たない。Overworld シーンが props を渡して render する。
 */
import { useEffect, useRef, useState } from 'preact/hooks';
import { PixelIcon } from '../PixelIcon';
import { RubyLabel } from '../RubyLabel';
import { RegionMiniMap, type RegionMiniView } from './RegionMiniMap';
import './field.css';

export interface FieldHudProps {
  title: string;
  sub: string;
  stamps: { n: number; total: number } | null;
  stampLabel: string;
  /** 左上の小さな地図（いまいる地方。行ったことのある県だけ はっきり）。タップで県の大きな地図 */
  map: RegionMiniView | null;
  mapLabel: string;
  onAreaMap: () => void;
  /** メニュー（ずかん・どうぐ・そうび）を ひらく */
  menuLabel: string;
  onMenu: () => void;
  /** 開発者モード（ぜんぶの 場所へ ワープ）。開発サーバーか ?dev のときだけ ボタンを出す */
  dev?: { label: string; on: boolean; onToggle: () => void };
}

export function FieldHud({
  title,
  sub,
  stamps,
  stampLabel,
  map,
  mapLabel,
  onAreaMap,
  menuLabel,
  onMenu,
  dev,
}: FieldHudProps) {
  return (
    <div class="nq-fhud">
      <div class="nq-win nq-fhud-loc">
        <div class="nq-fhud-row">
          <RubyLabel text={title} class="nq-fhud-title" />
          <RubyLabel text={sub} class="nq-fhud-sub" />
          {stamps && (
            <span class="nq-fhud-stamp" aria-label={stampLabel}>
              <PixelIcon name="star" scale={2} />
              {stamps.n}/{stamps.total}
            </span>
          )}
        </div>
        {map && <RegionMiniMap region={map} label={mapLabel} onOpen={onAreaMap} />}
      </div>
      <div class="nq-fhud-right">
        {dev && (
          <button
            type="button"
            class={`nq-win nq-fhud-btn nq-fhud-dev ${dev.on ? 'nq-fhud-dev-on' : ''}`}
            aria-pressed={dev.on}
            onClick={dev.onToggle}
          >
            <PixelIcon name="warp" scale={3} />
            {dev.label}
          </button>
        )}
        <button type="button" class="nq-win nq-fhud-btn" onClick={onMenu}>
          <PixelIcon name="role-shop" scale={3} />
          {menuLabel}
        </button>
        {/* にほんちずは 左上の地図（ひらいた地図の「にほんちず」ボタン）から */}
      </div>
    </div>
  );
}

function useOnce(fn: () => void): () => void {
  const done = useRef(false);
  return () => {
    if (done.current) return;
    done.current = true;
    fn();
  };
}

/** 場所を移動したとき、画面のまん中に「どこに来たか」（場所の名前と、フィールド・まち などの種類）を出す */
export function AreaTitle({ name, sub, onDone }: { name: string; sub: string; onDone: () => void }) {
  const done = useOnce(onDone);
  useEffect(() => {
    const id = setTimeout(done, 2600);
    return () => clearTimeout(id);
  }, []);
  return (
    <div class="nq-atitle" aria-live="polite">
      <div class="nq-win nq-atitle-box">
        <RubyLabel text={name} class="nq-atitle-name" />
        <RubyLabel text={sub} class="nq-atitle-sub" />
      </div>
    </div>
  );
}

export interface LandmarkCutinProps {
  title: string;
  name: string;
  kind: string;
  kindLabel: string;
  /** 本番の名所イラスト（assets/motifs/<県>/<id>.png）。無ければ種類のアイコン */
  image?: string;
  /** 絵が無いときのアイコン（省略時は名所の種類 motif-<kind>。宝箱の中身は chest） */
  icon?: string;
  onDone: () => void;
}

/** 名所・特産品・宝箱の中身を見つけたときのカットイン（タップで早送り） */
export function LandmarkCutin({ title, name, kind, kindLabel, image, icon, onDone }: LandmarkCutinProps) {
  const [imgOk, setImgOk] = useState(!!image);
  const done = useOnce(onDone);
  useEffect(() => {
    const id = setTimeout(done, 2200);
    return () => clearTimeout(id);
  }, []);
  return (
    <div class="nq-cutin" onClick={done}>
      <div class="nq-cutin-band">
        <div class="nq-win nq-cutin-card">
          <div class="nq-cutin-pic">
            {imgOk && image ? (
              <img src={image} alt="" onError={() => setImgOk(false)} />
            ) : (
              <PixelIcon name={icon ?? `motif-${kind}`} scale={9} />
            )}
          </div>
          <div class="nq-cutin-text">
            <span class="nq-cutin-title">
              <PixelIcon name="star" scale={3} />
              {title}
            </span>
            <RubyLabel text={name} class="nq-cutin-name" />
            <span class="nq-cutin-kind">{kindLabel}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
