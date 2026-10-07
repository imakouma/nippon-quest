/** ローカルの開発・確認環境か。本番ビルドを localhost で preview した場合も含む。 */
export function isLocalDevelopmentUrl(url: Pick<URL, 'hostname'>, dev: boolean): boolean {
  return dev || url.hostname === 'localhost' || url.hostname === '127.0.0.1' || url.hostname === '[::1]';
}

/** ローカル確認専用のセーブ初期化URLか。公開サイトでは絶対に有効にしない。 */
export function shouldResetLocalSaves(url: Pick<URL, 'hostname' | 'searchParams'>, dev: boolean): boolean {
  return url.searchParams.has('resetSaves') && isLocalDevelopmentUrl(url, dev);
}
