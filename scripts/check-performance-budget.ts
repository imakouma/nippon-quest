import { existsSync, readFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

export interface PerformanceSnapshot {
  initialJsGzipBytes: number;
  initialCssGzipBytes: number;
  contentBundleBytes: number;
}

export type PerformanceBudget = PerformanceSnapshot;

export const DEFAULT_PERFORMANCE_BUDGET: PerformanceBudget = {
  initialJsGzipBytes: 550_000,
  initialCssGzipBytes: 50_000,
  contentBundleBytes: 4_000_000,
};

const labels: Record<keyof PerformanceSnapshot, string> = {
  initialJsGzipBytes: 'initial JS',
  initialCssGzipBytes: 'initial CSS',
  contentBundleBytes: 'content bundle',
};

export function assessPerformanceBudget(
  snapshot: PerformanceSnapshot,
  budget: PerformanceBudget = DEFAULT_PERFORMANCE_BUDGET,
): string[] {
  return (Object.keys(labels) as (keyof PerformanceSnapshot)[]).flatMap((key) =>
    snapshot[key] > budget[key]
      ? [`${labels[key]}: ${snapshot[key].toLocaleString()} bytes > ${budget[key].toLocaleString()} bytes`]
      : [],
  );
}

interface ViteManifestEntry {
  file: string;
  css?: string[];
  imports?: string[];
  isEntry?: boolean;
  src?: string;
}

function gzipSize(path: string): number {
  return gzipSync(readFileSync(path)).byteLength;
}

export function readPerformanceSnapshot(distDir: string): PerformanceSnapshot {
  const manifestPath = join(distDir, '.vite', 'manifest.json');
  if (!existsSync(manifestPath))
    throw new Error(`${manifestPath} がありません。先に pnpm build を実行してください。`);
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as Record<string, ViteManifestEntry>;
  const entryKey = Object.keys(manifest).find((key) => {
    const entry = manifest[key];
    return entry?.isEntry && (entry.src === 'index.html' || key === 'index.html');
  });
  if (!entryKey) throw new Error('Vite manifest に index.html のentryがありません。');

  const visited = new Set<string>();
  const js = new Set<string>();
  const css = new Set<string>();
  const visit = (key: string): void => {
    if (visited.has(key)) return;
    visited.add(key);
    const entry = manifest[key];
    if (!entry) throw new Error(`Vite manifest のimport先がありません: ${key}`);
    if (entry.file.endsWith('.js')) js.add(entry.file);
    for (const file of entry.css ?? []) css.add(file);
    for (const imported of entry.imports ?? []) visit(imported);
  };
  visit(entryKey);

  return {
    initialJsGzipBytes: [...js].reduce((total, file) => total + gzipSize(join(distDir, file)), 0),
    initialCssGzipBytes: [...css].reduce((total, file) => total + gzipSize(join(distDir, file)), 0),
    contentBundleBytes: statSync(join(distDir, 'content', 'content-bundle.json')).size,
  };
}

function run(): void {
  const root = dirname(fileURLToPath(new URL('../package.json', import.meta.url)));
  const snapshot = readPerformanceSnapshot(join(root, 'dist'));
  const violations = assessPerformanceBudget(snapshot);
  console.log(
    `performance budget: JS ${snapshot.initialJsGzipBytes.toLocaleString()} gzip, CSS ${snapshot.initialCssGzipBytes.toLocaleString()} gzip, content ${snapshot.contentBundleBytes.toLocaleString()} raw`,
  );
  if (violations.length > 0) throw new Error(`性能予算を超えました:\n- ${violations.join('\n- ')}`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) run();
