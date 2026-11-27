import { visiblePixelBounds } from '../../rendering/monsterImageScale';
import { PixelIcon } from '../PixelIcon';
import type { BagThing } from './bagTypes';

/** Align the visible sprite, including equipped headwear, without cropping its frame. */
function centerImage(image: HTMLImageElement) {
  const { naturalWidth: width, naturalHeight: height } = image;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx || !width || !height) return;
  ctx.drawImage(image, 0, 0);
  const pixels = ctx.getImageData(0, 0, width, height).data;
  const bounds = visiblePixelBounds(width, height, (x, y) => pixels[(y * width + x) * 4 + 3]!);
  const dx = (0.5 - (bounds.x + bounds.width / 2) / width) * 100;
  const dy = (0.5 - (bounds.y + bounds.height / 2) / height) * 100;
  image.style.transform = `translate(${dx}%, ${dy}%)`;
}
export function Pic({
  x,
  size,
  centerVisible = false,
}: {
  x: BagThing;
  size: number;
  centerVisible?: boolean;
}) {
  const src = x.kind === 'hero' ? (x.art ?? x.icon) : size > 3 ? (x.art ?? x.icon) : x.icon;
  if (src)
    return <img src={src} alt="" onLoad={centerVisible ? (e) => centerImage(e.currentTarget) : undefined} />;
  return (
    <PixelIcon
      name={x.kind === 'hero' ? 'hero' : x.kind === 'equip' ? 'cmd-item' : `el-${x.element ?? 'none'}`}
      scale={size}
    />
  );
}
