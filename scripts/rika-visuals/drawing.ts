/** 480px幅の教材図。短いラベルと器具の輪郭をスマホでも読める大きさで描く。 */
export const ink = '#26394a';
export const xml = (s: string) =>
  s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;');
export const text = (s: string, x: number, y: number, size = 25) =>
  `<text x="${x}" y="${y}" font-size="${size}" text-anchor="middle">${xml(s)}</text>`;
export const path = (d: string, fill = 'none', stroke = ink, width = 3) =>
  `<path d="${d}" fill="${fill}" stroke="${stroke}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"/>`;
export const rect = (x: number, y: number, w: number, h: number, fill = '#edf4f8') =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="5" fill="${fill}" stroke="${ink}" stroke-width="3"/>`;
export const circle = (x: number, y: number, r: number, fill = '#fff') =>
  `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" stroke="${ink}" stroke-width="3"/>`;
export const group = (x: number, y: number, body: string, scale = 1) =>
  `<g transform="translate(${x} ${y}) scale(${scale})">${body}</g>`;
export const arrow = (x: number, y: number, length: number) =>
  `<g transform="translate(${x} ${y}) scale(${length < 0 ? -1 : 1} 1)">${path(`M0 0h${Math.abs(length)}m-10 -7l10 7-10 7`, 'none', '#386d91')}</g>`;
export const leaf = (x: number, y: number, flip = false) =>
  group(x, y, path('M0 0Q-42 -1 -42 -33Q-8 -37 0 0', '#85bf69') + path('M0 0l-30 -24'), flip ? -1 : 1);
export const plant = (flower = false) =>
  path('M0 110V0', 'none', '#416b40', 6) +
  leaf(0, 58) +
  group(0, 36, leaf(0, 0), -1) +
  path('M0 110l-26 28m26-28l24 29m-24-29v38m-13-24l-17 4m43-4l16 4', 'none', '#94623f') +
  (flower
    ? Array.from(
        { length: 8 },
        (_, i) =>
          `<ellipse cx="0" cy="-20" rx="12" ry="22" fill="#ffcf53" stroke="${ink}" stroke-width="2" transform="rotate(${i * 45})"/>`,
      ).join('') + circle(0, 0, 16, '#795138')
    : leaf(0, 10));
export const sprout = () =>
  path('M0 50V5', 'none', '#416b40', 5) +
  '<ellipse cx="-19" cy="5" rx="20" ry="12" fill="#85bf69" stroke="#26394a" stroke-width="3"/><ellipse cx="19" cy="5" rx="20" ry="12" fill="#85bf69" stroke="#26394a" stroke-width="3"/>' +
  path('M0 50l-13 25m13-25l13 25m-13-25v35', 'none', '#94623f');
export const seed = () =>
  path('M-15 10C-35-15-8-42 12-26C35-8 10 34-15 10', '#c7985c') +
  path('M-5-18q-10 13 1 25', 'none', '#755136');
export const battery = (reverse = false) =>
  group(
    0,
    0,
    rect(-42, -18, 84, 36, '#f4c65c') +
      rect(reverse ? -50 : 42, -7, 8, 14, '#d3dbe2') +
      text(reverse ? '+' : '−', -25, 8, 24) +
      text(reverse ? '−' : '+', 25, 8, 24),
  );
export const bulb = () =>
  circle(0, -14, 27, '#fff6cc') +
  rect(-13, 9, 26, 24, '#b7c2cb') +
  path('M-12 16h24m-24 9h24M-10-10l7 18m-7-18l10 5 10-5-7 18');
export const motor = () =>
  rect(-30, -22, 60, 44, '#b7d9e9') + circle(27, 0, 17, '#d7e5ec') + path('M27 0h32') + text('M', -8, 8, 24);
export const magnet = (reverse = false) =>
  rect(0, 0, 100, 34, '#79b8e8') +
  rect(0, 0, 50, 34, '#ed9a8c') +
  text(reverse ? 'S' : 'N', 25, 26) +
  text(reverse ? 'N' : 'S', 75, 26);
export const clip = () =>
  path('M0 0v30q0 15 12 15t12-15V-8q0-10-10-10T4-8v35q0 7 6 7t6-7V0', 'none', '#5c7186', 4);
export const beaker = (fill = '#b8dfff', closed = false) =>
  path('M-46-52v106h92V-52', '#f8fcff') +
  path('M-43-5h86v56h-86z', fill, 'none') +
  path('M-46-52h92M25-25h16m-16 30h16m-16 30h16') +
  (closed ? path('M-52-57H52', 'none', '#697e8d', 7) : '');
export const heat = () => path('M-12 14Q-23 0-6-14Q-9-2 3-20Q26 6 12 14Z', '#ed8b51');
export const thermometer = () =>
  rect(-10, -65, 20, 110, '#f8fcff') +
  circle(0, 43, 16, '#ee8075') +
  path('M0 43V-15', 'none', '#e0645b', 7) +
  Array.from({ length: 6 }, (_, i) => path(`M13 ${30 - i * 17}h${i % 2 ? 9 : 16}`)).join('');
export const fish = () =>
  path('M-60 0Q-15-50 45 0Q-15 50-60 0M45 0l32-25v50z', '#aacfe0') +
  circle(-36, -6, 4, ink) +
  path('M-22-18q15 18 0 36M-5-22l23-18 14 23M-10 25l17 15 16-22');
export const insect = () =>
  circle(0, -43, 17, '#9bb87c') +
  rect(-17, -25, 34, 35, '#78a96c') +
  '<ellipse cx="0" cy="38" rx="27" ry="40" fill="#a9c879" stroke="#26394a" stroke-width="3"/>' +
  [-18, -6, 7]
    .map((y, i) => path(`M-13 ${y}l-30 ${-23 + i * 22}l-15 16M13 ${y}l30 ${-23 + i * 22}l15 16`))
    .join('') +
  path('M-8-55l-12-17M8-55l12-17') +
  circle(-7, -46, 3, ink) +
  circle(7, -46, 3, ink);
export const caterpillar = () =>
  Array.from({ length: 6 }, (_, i) => circle(i * 18, 0, 14, '#8ac46d') + path(`M${i * 18} 12v10`)).join('') +
  circle(-4, -4, 3, ink);
export const butterfly = () =>
  path('M0 0C-75-85-85 40-8 20C-70 85-5 100 0 25C5 100 70 85 8 20C85 40 75-85 0 0', '#fff2c7') +
  path('M0-15v55M0-15l-13-18M0-15l13-18', 'none', ink, 5);
export const cloud = () => path('M-60 20Q-85-10-50-20Q-43-58-8-37Q20-64 42-30Q85-30 68 18Z', '#d7e4ed');
export const sun = () =>
  circle(0, 0, 25, '#ffd267') +
  Array.from(
    { length: 8 },
    (_, i) => `<g transform="rotate(${i * 45})">${path('M0-35v-12', 'none', '#bd8432')}</g>`,
  ).join('');
export const scale = (label = '? g') =>
  rect(-58, -10, 116, 43, '#d4e4e9') +
  path('M-68-15H68', 'none', ink, 6) +
  rect(-39, 0, 78, 27, '#fff') +
  text(label, 0, 22, 23);
export const tree = (season = 'summer') =>
  path('M-9 70V-15h18v85', '#b68a65') +
  path('M0 15l-38-40m38 20l38-32', 'none', '#9b744e', 7) +
  (season === 'winter'
    ? ''
    : path(
        'M-55 0Q-82-30-47-48Q-45-84 0-66Q50-91 53-47Q86-20 55 0Z',
        season === 'autumn' ? '#e7a852' : '#82b675',
      ));
export const circuit = (
  kind: 'single' | 'series' | 'parallel' | 'open' | 'motor' | 'reverse',
  motorLoad = false,
) => {
  const isMotor = motorLoad || kind === 'motor' || kind === 'reverse';
  const load = group(240, 70, isMotor ? motor() : bulb());
  const top = isMotor ? 'M65 175V70H210M210 85H415V175' : 'M65 175V87H227M240 103H415V175';
  let bottom = path('M65 175H198M290 175H415') + group(240, 175, battery(kind === 'reverse'));
  if (kind === 'series')
    bottom =
      path('M65 175H108M200 175H288M380 175H415') + group(150, 175, battery()) + group(330, 175, battery());
  if (kind === 'parallel')
    bottom =
      path('M65 175V220H198M290 220H415V175M65 150H198M290 150H415') +
      group(240, 150, battery()) +
      group(240, 220, battery());
  return (
    path(top) +
    bottom +
    load +
    (kind === 'open' ? rect(350, 156, 50, 36, '#fff') + path('M355 175l40-30') + circle(395, 175, 4) : '') +
    text(isMotor ? 'モーター' : '豆電球', 240, 30, 24)
  );
};
export const syringe = (water: boolean) =>
  text(water ? '水' : '空気', 235, 45) +
  rect(90, 80, 250, 65, water ? '#b8dfff' : '#f5f8fa') +
  rect(305, 82, 15, 61, '#7f97a7') +
  path('M320 112h105m0-30v60M90 102H65v20h25', 'none', ink, 5) +
  rect(52, 95, 13, 34, '#e59b87') +
  text('ふさぐ', 65, 185, 24) +
  arrow(390, 200, -55);
export const magnifier = () => circle(0, 0, 38, '#e6f5fd') + path('M28 28l40 40', 'none', '#8d765c', 15);
export const candle = () =>
  rect(-9, -25, 18, 60, '#fff1bb') + path('M0-25v-12') + group(0, -55, heat()) + path('M-33 38h66');
export const jar = (open = false) =>
  path('M-45-65V65H45V-65', '#f4faff') + path('M-48-65h96', 'none', '#70899c', open ? 2 : 7);
export const pendulum = () =>
  path('M-72 65L0-75 72 65M0-75v125') + circle(0, 50, 17, '#efbc67') + path('M-75-78H75');
export const arm = () =>
  path('M-95-55l80 80 100-60', 'none', '#e5be9d', 40) +
  path('M-95-55l80 80 100-60', 'none', '#fff5dc', 14) +
  circle(-15, 25, 15, '#fff5dc') +
  path('M-78-48q48-12 57 62', 'none', '#d77979', 16);
export const coil = () =>
  rect(-85, -13, 170, 26, '#b8c3cc') +
  Array.from({ length: 10 }, (_, i) => path(`M${-65 + i * 14}-22q20 22 0 44`, 'none', '#ce8a45', 5)).join(
    '',
  ) +
  path('M-65-22v-25h-35M61 22v25h40');
