import { iconUrl } from '../rendering/icons';

/** 8×8 のドットアイコンを整数倍で表示する（絵文字の代わり） */
export function PixelIcon({ name, scale = 3, class: cls }: { name: string; scale?: number; class?: string }) {
  const url = iconUrl(name);
  if (!url) return null;
  return (
    <img
      class={`nq-picon ${cls ?? ''}`}
      src={url}
      width={8 * scale}
      height={8 * scale}
      alt=""
      aria-hidden="true"
      draggable={false}
    />
  );
}
