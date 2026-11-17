import { arrow, circle, group, path, rect, text } from '../rika-visuals/drawing';
export {
  arrow,
  circle,
  group,
  path,
  rect,
  text,
  ink,
  xml,
  tree,
  fish,
  cloud,
  sun,
  leaf,
} from '../rika-visuals/drawing';
export type Draw = (
  name: string,
  hashes: string[],
  description: string,
  body: string,
  height?: number,
) => void;
export const house = () =>
  path('M-45-5L0-45 45-5v55h-90z', '#f5dfb6') + rect(-12, 15, 24, 35, '#b8d5e5') + path('M-52 0L0-48 52 0');
export const factory = () =>
  path('M-55 45V-15l35-25v25l35-25v25h35v60z', '#d7e2ec') +
  rect(32, -65, 15, 50, '#bacdd9') +
  [-35, -10, 15].map((x) => rect(x, 8, 15, 20, '#fff')).join('');
export const shop = () =>
  rect(-55, -25, 110, 75, '#f5dfb6') +
  path('M-60-25l10-25H50l10 25z', '#f0a08e') +
  rect(-40, 0, 45, 35, '#e3f4f9') +
  rect(20, 0, 22, 50, '#fff');
export const truck = () =>
  rect(-60, -32, 80, 60, '#d1e7ee') +
  path('M20-15h25l20 20v23H20z', '#f0c974') +
  rect(29, -8, 17, 18, '#fff') +
  circle(-35, 30, 13, '#526271') +
  circle(45, 30, 13, '#526271');
export const ship = () =>
  path('M-70 0H70L45 40H-45z', '#8eb6c9') +
  rect(-35, -38, 65, 37, '#f0c974') +
  rect(15, -60, 25, 22, '#cbdde9') +
  path('M-80 48q20-12 40 0t40 0t40 0t40 0', 'none', '#467a9c');
export const book = () =>
  path('M0-25Q-30-40-60-25v65Q-30 25 0 40Q30 25 60 40v-65Q30-40 0-25z', '#f5e9ce') +
  path('M0-25V40M-48-10q18-8 35 0m-35 16q18-8 35 0M13-10q18-8 35 0m-35 16q18-8 35 0');
export const bag = () =>
  rect(-35, -20, 70, 80, '#f0cc79') + path('M-20-20v-15q20-35 40 0v15', 'none', '#725b3c', 7);
export const person = () =>
  circle(0, -27, 13, '#e9c6a0') +
  path('M-20 32V0q20-15 40 0v32z', '#a5c8de') +
  path('M-10 32v25m20-25v25M-20 5l-15 25m55-25 15 25');
export const rice = () =>
  path('M0 40V-40M0-28q35 0 30 40M0-10q-20-20-30-10', 'none', '#537c49', 5) +
  [0, 1, 2, 3]
    .map((i) => group(22 + i * 3, -22 + i * 13, path('M-8 0q8-15 16 0q-8 15-16 0', '#e6c262')))
    .join('');
export const fruit = () =>
  circle(-15, 10, 28, '#ed9b78') +
  circle(15, 10, 28, '#ed9b78') +
  path('M0-10v-25M0-25q20-25 35-5q-12 15-35 5', '#82b475');
export const field = () =>
  path('M-60 45l25-85h75l25 85z', '#b0cc85') +
  [-20, 0, 20, 40].map((x) => path(`M${x} 35l10-65`, 'none', '#67884f')).join('');
export const boxes = () =>
  rect(-50, -30, 45, 65, '#dcbe8d') + rect(5, -30, 45, 65, '#dcbe8d') + path('M-28-30v22m55-22v22');
export const tap = () =>
  path('M-35 8v-20h55v20h20v25H20V8H-10v18h-25z', '#b7d5e0') +
  path('M-5-12v-18m-18 0h36', 'none', '#536f82', 6) +
  path('M30 45q-20 30 0 30q20 0 0-30', '#83bce0');
export const screen = () =>
  rect(-55, -40, 110, 75, '#dbeaf1') + path('M0 35v17m-35 0h70') + rect(-43, -28, 86, 50, '#fff');
export const panels = (items: [string, string][]) =>
  items
    .map(([label, icon], i) => group(80 + i * 160, 110, icon) + text(label, 80 + i * 160, 225, 24))
    .join('');
export const flow = (items: [string, string][]) =>
  panels(items) +
  items
    .slice(1)
    .map((_, i) => arrow(143 + i * 160, 110, 28))
    .join('');
export const direction = (labels = ['北', '東', '南', '西']) =>
  path('M240 45V215M155 130H325') +
  path('M235 55l5-12 5 12') +
  labels.map((s, i) => text(s, [240, 355, 240, 125][i]!, [30, 140, 247, 140][i]!, 27)).join('');
