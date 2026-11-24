import { readFileSync, lstatSync, writeFileSync, renameSync, unlinkSync } from 'node:fs';
import { parseEnv } from 'node:util';
import { randomUUID } from 'node:crypto';

// Process credentials locally; never print their values or include them in errors.
try {
  const source = process.argv[2];
  if (!source) throw new Error('GoogleからダウンロードしたJSONのパスを指定してください。');
  if (lstatSync(source).size > 131072) throw new Error('設定ファイルが大きすぎます。');
  const credentials = JSON.parse(readFileSync(source, 'utf8')).web;
  const currentFile = lstatSync('.env');
  if (!currentFile.isFile() || currentFile.isSymbolicLink())
    throw new Error('.envは通常ファイルにしてください。');
  const original = readFileSync('.env', 'utf8');
  const env = parseEnv(original);
  if (
    !credentials ||
    typeof credentials.client_id !== 'string' ||
    !/^[A-Za-z0-9._-]+\.apps\.googleusercontent\.com$/.test(credentials.client_id) ||
    typeof credentials.client_secret !== 'string' ||
    !/^[A-Za-z0-9._-]{16,}$/.test(credentials.client_secret)
  )
    throw new Error('Webアプリ用のGoogle OAuth設定JSONではありません。');
  if (
    !env.NQ_ORIGIN ||
    !Array.isArray(credentials.redirect_uris) ||
    !credentials.redirect_uris.includes(`${env.NQ_ORIGIN}/api/auth/callback/google`)
  )
    throw new Error('登録済みcallback URLと.envのNQ_ORIGINが一致しません。');
  const values = { GOOGLE_CLIENT_ID: credentials.client_id, GOOGLE_CLIENT_SECRET: credentials.client_secret };
  for (const [key, value] of Object.entries(values)) {
    if (env[key] && env[key] !== value) throw new Error('既存のGoogle設定と異なるため上書きを停止しました。');
  }
  const updated =
    original
      .split(/\r?\n/)
      .filter((line) => !/^\s*(?:export\s+)?GOOGLE_CLIENT_(?:ID|SECRET)\s*=/.test(line))
      .join('\n')
      .trimEnd() +
    '\n' +
    Object.entries(values)
      .map(([key, value]) => `${key}=${value}`)
      .join('\n') +
    '\n';
  const temporary = `.env.${randomUUID()}.tmp`;
  try {
    writeFileSync(temporary, updated, { flag: 'wx', mode: 0o600 });
    renameSync(temporary, '.env');
  } finally {
    try {
      unlinkSync(temporary);
    } catch {
      /* Renamed successfully, or never created. */
    }
  }
  console.log('Google設定を.envに保存しました。秘密値は表示していません。サーバーを再起動してください。');
} catch (error) {
  // Parser and OS errors can contain supplied credential text or filenames.
  const safe =
    error instanceof Error &&
    /^(Googleから|設定ファイルが|\.envは|Webアプリ用|登録済みcallback|既存のGoogle設定)/.test(error.message);
  console.error(
    safe ? error.message : '設定を読み込めませんでした。JSON形式とファイルの権限を確認してください。',
  );
  process.exitCode = 1;
}
