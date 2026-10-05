export interface AssetCatalog {
  files?: unknown;
}

const files = new Set<string>();
let assetBase = '';

/** 生成済みカタログを一度だけ登録し、同期描画コードから完成画像の有無を引けるようにする。 */
export function setAssetCatalog(catalog: AssetCatalog, base = ''): void {
  files.clear();
  if (Array.isArray(catalog.files))
    for (const path of catalog.files)
      if (typeof path === 'string' && path && !path.startsWith('/') && !path.includes('..')) files.add(path);
  assetBase = base.replace(/\/$/, '');
}

/** 完成画像が存在するときだけ配信用URLを返す。未制作なら生成画像へフォールバックできる。 */
export function existingAssetUrl(path: string): string | undefined {
  return files.has(path) ? `${assetBase}/assets/${path}` : undefined;
}
