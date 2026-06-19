/**
 * tizukigou の地図記号カードからラベル文字を白でマスクする
 */
import { mkdirSync, readdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "../..");
const SRC_DIR = join(ROOT, "tizukigou");
const OUT_DIR = join(__dirname, "../public/maps/map-symbols");

function isDarkText(r: number, g: number, b: number): boolean {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  // 黒〜グレーのラベル文字（legacy PNG のアンチエイリアス）
  if (max < 240 && max - min < 30) return true;
  return r < 100 && g < 100 && b < 100;
}

function isBrightInk(r: number, g: number, b: number): boolean {
  return r > 185 && g > 185 && b > 185;
}

function isSymbolBlue(r: number, g: number, b: number): boolean {
  return b > 95 && b > r + 20 && r < 130;
}

function findBlueBounds(
  data: Buffer,
  width: number,
  height: number,
  channels: number,
): { x1: number; y1: number; x2: number; y2: number } | null {
  let x1 = width;
  let y1 = height;
  let x2 = 0;
  let y2 = 0;
  let found = false;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * channels;
      if (!isSymbolBlue(data[i], data[i + 1], data[i + 2])) continue;
      found = true;
      x1 = Math.min(x1, x);
      y1 = Math.min(y1, y);
      x2 = Math.max(x2, x);
      y2 = Math.max(y2, y);
    }
  }
  return found ? { x1, y1, x2, y2 } : null;
}

function countCenterDark(
  data: Buffer,
  width: number,
  channels: number,
  y: number,
): number {
  const x1 = Math.floor(width * 0.2);
  const x2 = Math.floor(width * 0.8);
  let dark = 0;
  for (let x = x1; x < x2; x++) {
    const i = (y * width + x) * channels;
    if (isDarkText(data[i], data[i + 1], data[i + 2])) dark++;
  }
  return dark;
}

function getCenterSpan(
  data: Buffer,
  width: number,
  channels: number,
  y: number,
): number {
  const x1 = Math.floor(width * 0.2);
  const x2 = Math.floor(width * 0.8);
  let minX = x2;
  let maxX = x1;
  for (let x = x1; x < x2; x++) {
    const i = (y * width + x) * channels;
    if (!isDarkText(data[i], data[i + 1], data[i + 2])) continue;
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
  }
  return maxX >= minX ? maxX - minX + 1 : 0;
}

/** 記号とラベルの境界行（この行から下の黒文字だけ消す） */
function findClearFromY(
  data: Buffer,
  width: number,
  height: number,
  channels: number,
): number {
  const yMaxGap = Math.ceil(height * (height > 110 ? 0.55 : 0.78));
  let lastDark = 0;
  let gap = 0;

  for (let y = Math.floor(height * 0.15); y < yMaxGap; y++) {
    const dark = countCenterDark(data, width, channels, y);
    if (dark >= 3) {
      lastDark = y;
      gap = 0;
      continue;
    }
    gap++;
    if (gap >= 3 && lastDark > 0) {
      return lastDark + 1;
    }
  }

  let baseline = 0;
  let baselineRows = 0;
  const baselineEnd = Math.floor(height * 0.42);
  for (let y = Math.floor(height * 0.18); y < baselineEnd; y++) {
    baseline += countCenterDark(data, width, channels, y);
    baselineRows++;
  }
  const avgDark = baselineRows > 0 ? baseline / baselineRows : 6;
  const jumpFrom = Math.floor(height * 0.5);
  for (let y = Math.max(baselineEnd, jumpFrom); y < Math.floor(height * 0.9); y++) {
    const dark = countCenterDark(data, width, channels, y);
    const nextDark = countCenterDark(data, width, channels, y + 1);
    if (
      dark > Math.max(16, avgDark * 2.2) &&
      nextDark > Math.max(12, avgDark * 1.8)
    ) {
      return y;
    }
  }

  let lastNarrow = 0;
  for (let y = Math.floor(height * 0.15); y < Math.floor(height * 0.85); y++) {
    const span = getCenterSpan(data, width, channels, y);
    if (span === 0) {
      lastNarrow = 0;
      continue;
    }
    const narrow = span < width * 0.45;
    const wide = span >= width * 0.52;
    if (narrow) {
      lastNarrow = y;
      continue;
    }
    if (wide && lastNarrow > 0 && y > lastNarrow + 1) {
      const narrowDark = countCenterDark(data, width, channels, lastNarrow);
      const wideDark = countCenterDark(data, width, channels, y);
      if (
        y > height * 0.58 &&
        lastNarrow > height * 0.35 &&
        wideDark > Math.max(14, narrowDark * 2)
      ) {
        return y;
      }
      lastNarrow = 0;
    }
  }

  let bottom = 0;
  const yLimit = Math.floor(height * 0.5);
  for (let y = 0; y < yLimit; y++) {
    if (countCenterDark(data, width, channels, y) >= 4) bottom = y;
  }
  return bottom + (height > 110 ? 10 : 8);
}

/** テキスト開始列（横長カード用） */
function findTextStartX(
  data: Buffer,
  width: number,
  height: number,
  channels: number,
): number {
  const from = Math.floor(width * 0.38);
  for (let x = from; x < width; x++) {
    let dark = 0;
    const yStart = Math.floor(height * 0.15);
    const yEnd = Math.floor(height * 0.85);
    for (let y = yStart; y < yEnd; y++) {
      const i = (y * width + x) * channels;
      if (isDarkText(data[i], data[i + 1], data[i + 2])) dark++;
    }
    if (dark > height * 0.08) return x;
  }
  return Math.floor(width * 0.55);
}

function darkScoreInRect(
  data: Buffer,
  width: number,
  height: number,
  channels: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): number {
  let dark = 0;
  let total = 0;
  for (let y = y1; y < y2; y++) {
    for (let x = x1; x < x2; x++) {
      total++;
      const i = (y * width + x) * channels;
      if (isDarkText(data[i], data[i + 1], data[i + 2])) dark++;
    }
  }
  return total > 0 ? dark / total : 0;
}

/** 記号領域の右端（横長カード用・右側ラベルは見ない） */
function findSymbolRight(
  data: Buffer,
  width: number,
  height: number,
  channels: number,
): number {
  let right = 0;
  const yPad = Math.floor(height * 0.1);
  const xLimit = Math.floor(width * 0.52);
  for (let x = 0; x < xLimit; x++) {
    let ink = 0;
    for (let y = yPad; y < height - yPad; y++) {
      const i = (y * width + x) * channels;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      if (isDarkText(r, g, b) || (b > 120 && r < 120)) ink++;
    }
    if (ink > height * 0.05) right = x;
  }
  return right;
}

/** ラベル付き legacy PNG（public/maps/map-symbols 内） */
const LEGACY_LABELED_PNGS = [
  "000243019.png",
  "000243020.png",
];

export async function processImage(input: string, output: string) {
  const { data, info } = await sharp(input)
    .flatten({ background: { r: 255, g: 255, b: 255 } })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const channels = info.channels ?? 3;
  const { width, height } = info;
  const isWide = width / height > 1.15;
  const bottomTextScore = darkScoreInRect(
    data,
    width,
    height,
    channels,
    Math.floor(width * 0.08),
    Math.floor(height * 0.45),
    Math.floor(width * 0.92),
    height,
  );
  const rightTextScore = darkScoreInRect(
    data,
    width,
    height,
    channels,
    Math.floor(width * 0.42),
    Math.floor(height * 0.1),
    width,
    Math.floor(height * 0.9),
  );
  // 横長でも下段ラベル型（駅記号カード等）は下側マスクを使う
  const isHorizontalRight =
    isWide &&
    height > 70 &&
    rightTextScore > bottomTextScore * 1.2;

  let maskLeft = 0;
  if (isHorizontalRight) {
    const symbolRight = findSymbolRight(data, width, height, channels);
    const textStartX = findTextStartX(data, width, height, channels);
    maskLeft = Math.min(
      width - 1,
      Math.max(textStartX - 10, symbolRight + 4, Math.floor(width * 0.42)),
    );
  }

  const composited = await sharp(input)
    .flatten({ background: { r: 255, g: 255, b: 255 } })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const out = Buffer.from(composited.data);
  const { width: w2, height: h2 } = composited.info;
  const ch = composited.info.channels ?? 3;

  if (!isHorizontalRight) {
    const clearFromY = findClearFromY(data, width, height, channels);
    const xStart = Math.floor(w2 * 0.05);
    const xEnd = Math.floor(w2 * 0.95);
    for (let y = clearFromY; y < h2; y++) {
      for (let x = xStart; x < xEnd; x++) {
        const i = (y * w2 + x) * ch;
        if (isDarkText(out[i], out[i + 1], out[i + 2])) {
          out[i] = 255;
          out[i + 1] = 255;
          out[i + 2] = 255;
        }
      }
    }
    // 駅記号カード等: 下段ラベルの薄い残りを消す
    if (height <= 70) {
      const yEnd = h2 - Math.max(3, Math.floor(h2 * 0.08));
      for (let y = clearFromY; y < yEnd; y++) {
        for (let x = xStart; x < xEnd; x++) {
          const i = (y * w2 + x) * ch;
          const max = Math.max(out[i], out[i + 1], out[i + 2]);
          if (max < 250) {
            out[i] = 255;
            out[i + 1] = 255;
            out[i + 2] = 255;
          }
        }
      }
    }
  } else {
    for (let y = 0; y < h2; y++) {
      for (let x = maskLeft; x < w2; x++) {
        const i = (y * w2 + x) * ch;
        if (isDarkText(out[i], out[i + 1], out[i + 2])) {
          out[i] = 255;
          out[i + 1] = 255;
          out[i + 2] = 255;
        }
      }
    }
  }

  // 記号内の白文字（国道番号など）を記号色で塗りつぶす
  const blueBounds = findBlueBounds(out, w2, h2, ch);
  if (blueBounds) {
    let sr = 0;
    let sg = 0;
    let sb = 0;
    let blueN = 0;
    for (let y = blueBounds.y1; y <= blueBounds.y2; y++) {
      for (let x = blueBounds.x1; x <= blueBounds.x2; x++) {
        const i = (y * w2 + x) * ch;
        if (!isSymbolBlue(out[i], out[i + 1], out[i + 2])) continue;
        sr += out[i];
        sg += out[i + 1];
        sb += out[i + 2];
        blueN++;
      }
    }
    if (blueN > 0) {
      const fillR = Math.round(sr / blueN);
      const fillG = Math.round(sg / blueN);
      const fillB = Math.round(sb / blueN);
      for (let pass = 0; pass < 6; pass++) {
        for (let y = blueBounds.y1; y <= blueBounds.y2; y++) {
          for (let x = blueBounds.x1; x <= blueBounds.x2; x++) {
            const i = (y * w2 + x) * ch;
            if (!isBrightInk(out[i], out[i + 1], out[i + 2])) continue;

            let blueNear = 0;
            for (let dy = -1; dy <= 1; dy++) {
              for (let dx = -1; dx <= 1; dx++) {
                if (dx === 0 && dy === 0) continue;
                const nx = x + dx;
                const ny = y + dy;
                if (nx < 0 || ny < 0 || nx >= w2 || ny >= h2) continue;
                const j = (ny * w2 + nx) * ch;
                if (
                  isSymbolBlue(out[j], out[j + 1], out[j + 2]) ||
                  (out[j] === fillR && out[j + 1] === fillG && out[j + 2] === fillB)
                ) {
                  blueNear++;
                }
              }
            }
            if (blueNear < 2) continue;

            out[i] = fillR;
            out[i + 1] = fillG;
            out[i + 2] = fillB;
          }
        }
      }
    }

    // シールド付近の小さな黒文字を白で消す
    const padX = 8;
    const padY = 4;
    for (
      let y = Math.max(0, blueBounds.y2 - padY);
      y < Math.min(h2, blueBounds.y2 + padY + 10);
      y++
    ) {
      for (
        let x = Math.max(0, blueBounds.x2 - padX);
        x < Math.min(w2, blueBounds.x2 + padX + 8);
        x++
      ) {
        const i = (y * w2 + x) * ch;
        if (isDarkText(out[i], out[i + 1], out[i + 2])) {
          out[i] = 255;
          out[i + 1] = 255;
          out[i + 2] = 255;
        }
      }
    }
  }

  await sharp(out, { raw: { width: w2, height: h2, channels: ch } })
    .png()
    .toFile(output);
}

async function main() {
  if (!existsSync(SRC_DIR)) {
    console.error("Source not found:", SRC_DIR);
    process.exit(1);
  }

  mkdirSync(OUT_DIR, { recursive: true });

  const files = readdirSync(SRC_DIR).filter((f) => f.endsWith(".png"));
  for (const file of files) {
    await processImage(join(SRC_DIR, file), join(OUT_DIR, file));
  }

  for (const file of LEGACY_LABELED_PNGS) {
    const path = join(OUT_DIR, file);
    if (!existsSync(path)) continue;
    await processImage(path, path);
    console.log(`Processed legacy ${file}`);
  }

  console.log(`Processed ${files.length} map symbols -> ${OUT_DIR}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
