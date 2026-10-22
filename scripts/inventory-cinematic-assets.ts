/** Git 外に保管する動画制作素材の、相対パス・容量・SHA-256 目録を作る。 */
import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { lstat, mkdir, readdir, stat, writeFile } from 'node:fs/promises';
import { dirname, extname, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { format, resolveConfig } from 'prettier';

interface CinematicAssetEntry {
  path: string;
  bytes: number;
  sha256: string;
  mediaType: string;
}

export interface CinematicAssetInventory {
  version: 1;
  policy: {
    paths: 'relative';
    digest: 'sha256';
    binariesTrackedInGit: false;
  };
  summary: {
    fileCount: number;
    totalBytes: number;
    maxFile: { path: string; bytes: number } | null;
    overRegularGitLimit: number;
    byExtension: Record<string, { files: number; bytes: number }>;
  };
  files: CinematicAssetEntry[];
}

const REGULAR_GIT_FILE_LIMIT_BYTES = 100 * 1024 * 1024;
const MEDIA_TYPES: Record<string, string> = {
  '.gif': 'image/gif',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.json': 'application/json',
  '.m4a': 'audio/mp4',
  '.mov': 'video/quicktime',
  '.mp3': 'audio/mpeg',
  '.mp4': 'video/mp4',
  '.png': 'image/png',
  '.txt': 'text/plain',
  '.wav': 'audio/wav',
  '.webm': 'video/webm',
  '.webp': 'image/webp',
};

async function sha256(file: string): Promise<string> {
  const hash = createHash('sha256');
  await new Promise<void>((resolveHash, reject) => {
    const stream = createReadStream(file);
    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('end', resolveHash);
    stream.on('error', reject);
  });
  return hash.digest('hex');
}

async function listFiles(rootDir: string, directory = rootDir): Promise<string[]> {
  const files: string[] = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name);
    const metadata = await lstat(path);
    if (metadata.isSymbolicLink()) {
      throw new Error(`シンボリックリンクは目録化できません: ${relative(rootDir, path)}`);
    }
    if (entry.isDirectory()) files.push(...(await listFiles(rootDir, path)));
    else if (entry.isFile()) files.push(path);
  }
  return files;
}

export async function buildCinematicAssetInventory(sourceRoot: string): Promise<CinematicAssetInventory> {
  const rootDir = resolve(sourceRoot);
  if (!(await stat(rootDir)).isDirectory())
    throw new Error(`素材ルートがディレクトリではありません: ${sourceRoot}`);
  const absoluteFiles = (await listFiles(rootDir)).sort((a, b) => a.localeCompare(b));
  const files: CinematicAssetEntry[] = [];

  for (const file of absoluteFiles) {
    const metadata = await stat(file);
    const extension = extname(file).toLowerCase();
    files.push({
      path: relative(rootDir, file).split(sep).join('/'),
      bytes: metadata.size,
      sha256: await sha256(file),
      mediaType: MEDIA_TYPES[extension] ?? 'application/octet-stream',
    });
  }

  const extensionTotals = new Map<string, { files: number; bytes: number }>();
  for (const file of files) {
    const extension = extname(file.path).toLowerCase() || '(none)';
    const current = extensionTotals.get(extension) ?? { files: 0, bytes: 0 };
    current.files += 1;
    current.bytes += file.bytes;
    extensionTotals.set(extension, current);
  }
  const maxFile = files.reduce<CinematicAssetEntry | null>(
    (largest, file) => (!largest || file.bytes > largest.bytes ? file : largest),
    null,
  );

  return {
    version: 1,
    policy: { paths: 'relative', digest: 'sha256', binariesTrackedInGit: false },
    summary: {
      fileCount: files.length,
      totalBytes: files.reduce((sum, file) => sum + file.bytes, 0),
      maxFile: maxFile ? { path: maxFile.path, bytes: maxFile.bytes } : null,
      overRegularGitLimit: files.filter((file) => file.bytes > REGULAR_GIT_FILE_LIMIT_BYTES).length,
      byExtension: Object.fromEntries([...extensionTotals].sort(([a], [b]) => a.localeCompare(b))),
    },
    files,
  };
}

function readFlag(args: string[], name: string): string | undefined {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
}

function usage(): string {
  return [
    '使い方:',
    '  pnpm inventory:cinematics -- --root /path/to/cinematic-assets-local',
    '    [--output imports/cinematic-assets-manifest.json]',
  ].join('\n');
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  if (args.includes('--help')) {
    console.log(usage());
    return;
  }
  const sourceRoot = readFlag(args, '--root');
  if (!sourceRoot) throw new Error(usage());

  const repositoryRoot = resolve('.');
  const output = resolve(
    repositoryRoot,
    readFlag(args, '--output') ?? 'imports/cinematic-assets-manifest.json',
  );
  const relativeOutput = relative(repositoryRoot, output);
  if (!relativeOutput || relativeOutput.startsWith(`..${sep}`) || relativeOutput === '..') {
    throw new Error('出力先はリポジトリ内のファイルを指定してください');
  }

  const inventory = await buildCinematicAssetInventory(sourceRoot);
  await mkdir(dirname(output), { recursive: true });
  await writeFile(
    output,
    await format(JSON.stringify(inventory), {
      ...(await resolveConfig(output)),
      filepath: output,
    }),
    'utf8',
  );
  console.log(
    `cinematic assets: ${inventory.summary.fileCount} files / ${inventory.summary.totalBytes} bytes`,
  );
}

const entryPath = process.argv[1] ? resolve(process.argv[1]) : '';
if (entryPath === fileURLToPath(import.meta.url)) {
  await main();
}
