import type Phaser from 'phaser';

/** 完成済み Canvas は画素編集用の CanvasTexture を作らず、そのまま登録する。 */
function addStaticCanvas(textures: Phaser.Textures.TextureManager, key: string, canvas: HTMLCanvasElement) {
  const texture = textures.create(key, canvas);
  if (!texture) return null;
  texture.add('__BASE', 0, 0, 0, canvas.width, canvas.height);
  textures.emit('addtexture', key, texture);
  textures.emit(`addtexture-${key}`, texture);
  return texture;
}

/**
 * Canvas を Phaser のスプライトシートとして登録する（コマ番号 0,1,2… を左上から右へ、行ごとに振る）。
 * 本番の PNG を同じキーで先に読み込んでいれば、そちらを優先して何もしない。
 */
export function addSheet(
  textures: Phaser.Textures.TextureManager,
  key: string,
  canvas: HTMLCanvasElement,
  fw: number,
  fh: number,
): void {
  if (textures.exists(key)) return;
  const tex = addStaticCanvas(textures, key, canvas);
  if (!tex) return;
  const cols = Math.floor(canvas.width / fw);
  const rows = Math.floor(canvas.height / fh);
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) tex.add(r * cols + c, 0, c * fw, r * fh, fw, fh);
}

/** 1 枚絵のテクスチャ（同じキーがあれば何もしない） */
export function addImage(
  textures: Phaser.Textures.TextureManager,
  key: string,
  canvas: HTMLCanvasElement,
): void {
  if (!textures.exists(key)) addStaticCanvas(textures, key, canvas);
}
