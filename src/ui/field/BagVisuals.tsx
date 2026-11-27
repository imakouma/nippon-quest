import { PixelIcon } from '../PixelIcon';
import type { BagThing } from './bagTypes';

export function Pic({ x, size }: { x: BagThing; size: number }) {
  const src = x.kind === 'hero' ? (x.art ?? x.icon) : size > 3 ? (x.art ?? x.icon) : x.icon;
  if (src) return <img src={src} alt="" />;
  return (
    <PixelIcon
      name={x.kind === 'hero' ? 'hero' : x.kind === 'equip' ? 'cmd-item' : `el-${x.element ?? 'none'}`}
      scale={size}
    />
  );
}
