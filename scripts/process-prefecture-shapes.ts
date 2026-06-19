/**
 * todouhukenkatati の画像で県名テキストだけを白マスクし、形は一切切り取らない
 */
import { mkdirSync, readdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "../..");
const SRC_DIR = join(ROOT, "todouhukenkatati");
const OUT_DIR = join(__dirname, "../public/maps/prefecture-shapes");

function isShapeFill(r: number, g: number, b: number): boolean {
  if (r < 55 && g < 50 && b < 45) return false;
  if (r > 245 && g > 245 && b > 245) return false;
  if (Math.max(r, g, b) - Math.min(r, g, b) < 35) return false;
  return (
    (r > 175 && g > 115 && b < 215) ||
    (r > 195 && g > 65 && g < 215 && b < 175)
  );
}

function findShapeBottom(
  data: Buffer,
  width: number,
  height: number,
  channels: number,
): number {
  let bottom = 0;
  for (let y = 0; y < height; y++) {
    let count = 0;
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * channels;
      if (isShapeFill(data[i], data[i + 1], data[i + 2])) count++;
    }
    if (count > width * 0.004) bottom = y;
  }
  return bottom;
}

function findTextStart(
  data: Buffer,
  width: number,
  height: number,
  channels: number,
): number {
  const from = Math.floor(height * 0.52);
  for (let y = from; y < height; y++) {
    let dark = 0;
    const xStart = Math.floor(width * 0.1);
    const xEnd = Math.floor(width * 0.9);
    for (let x = xStart; x < xEnd; x++) {
      const i = (y * width + x) * channels;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      if (r < 95 && g < 95 && b < 95) dark++;
    }
    if (dark > width * 0.03) return y;
  }
  return Math.floor(height * 0.78);
}

async function processImage(input: string, output: string) {
  const { data, info } = await sharp(input)
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const channels = info.channels ?? 3;
  const { width, height } = info;
  const shapeBottom = findShapeBottom(data, width, height, channels);
  const textStart = findTextStart(data, width, height, channels);

  // 形の下端より上は絶対にマスクしない。テキスト直前から白で隠す
  const maskTop = Math.min(
    height - 1,
    Math.max(shapeBottom + 10, textStart - 28),
  );
  const maskHeight = height - maskTop;

  const whiteMask = await sharp({
    create: {
      width,
      height: maskHeight,
      channels: 3,
      background: { r: 255, g: 255, b: 255 },
    },
  })
    .png()
    .toBuffer();

  await sharp(input)
    .composite([{ input: whiteMask, top: maskTop, left: 0 }])
    .flatten({ background: { r: 255, g: 255, b: 255 } })
    .png()
    .toFile(output);

  const outMeta = await sharp(output).metadata();
  if (outMeta.height !== height) {
    throw new Error(
      `${output}: height mismatch ${outMeta.height} !== ${height}`,
    );
  }
}

async function main() {
  if (!existsSync(SRC_DIR)) {
    console.error("Source not found:", SRC_DIR);
    process.exit(1);
  }

  mkdirSync(OUT_DIR, { recursive: true });

  const files = readdirSync(SRC_DIR).filter((f) => f.endsWith(".png"));
  for (const file of files) {
    const id = file.replace(/\.png$/i, "").replace(/-1$/, "");
    await processImage(join(SRC_DIR, file), join(OUT_DIR, `${id}.png`));
  }

  console.log(`Processed ${files.length} images -> ${OUT_DIR}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
