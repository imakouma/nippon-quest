/**
 * sekaitizu.png から海洋ラベル文字を海色でマスクする
 */
import { existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "../..");
const SRC = join(ROOT, "sekaitizu/sekaitizu.png");
const OUT = join(__dirname, "../public/maps/world/sekaitizu.png");

type Region = { x1: number; y1: number; x2: number; y2: number };

// 1792x1072 地図上の海洋ラベル領域（余白込み）
const LABEL_REGIONS: Region[] = [
  { x1: 900, y1: 420, x2: 1180, y2: 530 }, // 太平洋
  { x1: 680, y1: 550, x2: 1160, y2: 770 }, // インド洋
  { x1: 1540, y1: 440, x2: 1792, y2: 560 }, // 大西洋
];

function isLand(r: number, g: number, b: number): boolean {
  return g > 95 && g > b + 8 && r > 80 && r < 220;
}

function isOcean(r: number, g: number, b: number): boolean {
  return b > 150 && b > r && !isLand(r, g, b);
}

function inRegion(x: number, y: number, region: Region): boolean {
  return x >= region.x1 && x < region.x2 && y >= region.y1 && y < region.y2;
}

function inAnyRegion(x: number, y: number): boolean {
  return LABEL_REGIONS.some((r) => inRegion(x, y, r));
}

function sampleOceanColor(
  data: Buffer,
  width: number,
  height: number,
  channels: number,
  region: Region,
): [number, number, number] {
  let sr = 0;
  let sg = 0;
  let sb = 0;
  let count = 0;
  const pad = 24;

  for (let y = region.y1 - pad; y < region.y2 + pad; y++) {
    for (let x = region.x1 - pad; x < region.x2 + pad; x++) {
      if (x < 0 || y < 0 || x >= width || y >= height) continue;
      if (inRegion(x, y, region)) continue;
      const i = (y * width + x) * channels;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      if (!isOcean(r, g, b)) continue;
      sr += r;
      sg += g;
      sb += b;
      count++;
    }
  }

  if (count > 0) {
    return [
      Math.round(sr / count),
      Math.round(sg / count),
      Math.round(sb / count),
    ];
  }
  return [197, 219, 239];
}

async function main() {
  if (!existsSync(SRC)) {
    console.error("Source not found:", SRC);
    process.exit(1);
  }

  const { data, info } = await sharp(SRC)
    .flatten({ background: { r: 255, g: 255, b: 255 } })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height } = info;
  const channels = info.channels ?? 3;
  const out = Buffer.from(data);
  const regionColors = LABEL_REGIONS.map((region) =>
    sampleOceanColor(data, width, height, channels, region),
  );

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (!inAnyRegion(x, y)) continue;
      const i = (y * width + x) * channels;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      if (isLand(r, g, b)) continue;
      if (r < 80 && g < 80 && b < 80) continue; // 矢印・黒点は残す

      const regionIdx = LABEL_REGIONS.findIndex((region) =>
        inRegion(x, y, region),
      );
      const [or, og, ob] = regionColors[regionIdx] ?? [197, 219, 239];
      out[i] = or;
      out[i + 1] = og;
      out[i + 2] = ob;
    }
  }

  await sharp(out, { raw: { width, height, channels: 3 } }).png().toFile(OUT);

  console.log("Processed world map ->", OUT);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
