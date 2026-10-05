/** 東北公開ビルドへ入る素材の存在・権利状態・音声フォールバックを決定的に監査する。 */
import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { extname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const ROOT = resolve('.');
const LEDGER = 'assets/rights/tohoku-release-ledger.json';
const REPORT = 'assets/rights/tohoku-release-audit.json';
const MEDIA_EXTENSIONS = new Set([
  '.png',
  '.jpg',
  '.jpeg',
  '.webp',
  '.gif',
  '.svg',
  '.mp3',
  '.ogg',
  '.wav',
  '.m4a',
  '.woff',
  '.woff2',
  '.ttf',
  '.otf',
]);

type Status = 'approved' | 'hold';
interface Group {
  id: string;
  paths?: string[];
  pathPrefix?: string;
  pathPrefixes?: string[];
  status: Status;
  origin: string;
  author: string;
  source: string;
  license: string;
  licenseEvidence: string | null;
  modificationAllowed: boolean | null;
  redistributionAllowed: boolean | null;
  creditRequired: boolean | null;
  sha256?: Record<string, string>;
  releaseAction?: string;
}
interface Ledger {
  schemaVersion: number;
  scope: string;
  groups: Group[];
}

function walk(directory: string): string[] {
  if (!existsSync(resolve(ROOT, directory))) return [];
  return readdirSync(resolve(ROOT, directory), { withFileTypes: true }).flatMap((entry) => {
    const path = `${directory}/${entry.name}`;
    return entry.isDirectory() ? walk(path) : [path];
  });
}

function sha256(path: string): string {
  return createHash('sha256')
    .update(readFileSync(resolve(ROOT, path)))
    .digest('hex');
}

function mediaFiles(): string[] {
  const copiedAssets = walk('assets').filter((path) => MEDIA_EXTENSIONS.has(extname(path).toLowerCase()));
  const bundledFonts = walk('src/ui/fonts').filter((path) =>
    MEDIA_EXTENSIONS.has(extname(path).toLowerCase()),
  );
  const publicMedia = walk('public').filter((path) => MEDIA_EXTENSIONS.has(extname(path).toLowerCase()));
  return [...new Set([...copiedAssets, ...bundledFonts, ...publicMedia])].sort();
}

function groupFor(path: string, groups: Group[]): Group[] {
  return groups.filter(
    (group) =>
      group.paths?.includes(path) ||
      (group.pathPrefix && path.startsWith(group.pathPrefix)) ||
      group.pathPrefixes?.some((prefix) => path.startsWith(prefix)),
  );
}

function findQuestionRefs(value: unknown, refs: Set<string>): void {
  if (Array.isArray(value)) return value.forEach((item) => findQuestionRefs(item, refs));
  if (!value || typeof value !== 'object') return;
  for (const [key, child] of Object.entries(value)) {
    if (typeof child === 'string' && ['image', 'promptImage', 'audio', 'promptAudio'].includes(key))
      refs.add(`assets/${child}`);
    else findQuestionRefs(child, refs);
  }
}

function releaseQuestionReferences(): string[] {
  const refs = new Set<string>();
  for (const path of walk('content/questions').filter(
    (path) => path.endsWith('.json') && !path.includes('/_samples/'),
  )) {
    findQuestionRefs(JSON.parse(readFileSync(resolve(ROOT, path), 'utf8')) as unknown, refs);
  }
  return [...refs].sort();
}

export async function auditTohokuAssetsRights() {
  const ledger = JSON.parse(readFileSync(resolve(ROOT, LEDGER), 'utf8')) as Ledger;
  const media = mediaFiles();
  const coverage = media.map((path) => ({
    path,
    groups: groupFor(path, ledger.groups).map((group) => group.id),
  }));
  const uncovered = coverage.filter((item) => item.groups.length === 0).map((item) => item.path);
  const multiplyCovered = coverage.filter((item) => item.groups.length > 1);
  const missingDeclared = ledger.groups
    .flatMap((group) => group.paths ?? [])
    .filter((path) => !existsSync(resolve(ROOT, path)));
  const hashMismatches = ledger.groups.flatMap((group) =>
    Object.entries(group.sha256 ?? {}).flatMap(([path, expected]) => {
      if (!existsSync(resolve(ROOT, path))) return [];
      const actual = sha256(path);
      return actual === expected ? [] : [{ path, expected, actual }];
    }),
  );
  const invalidApprovals = ledger.groups
    .filter((group) => group.status === 'approved')
    .filter(
      (group) =>
        !group.licenseEvidence ||
        !existsSync(resolve(ROOT, group.licenseEvidence)) ||
        group.redistributionAllowed !== true,
    )
    .map((group) => group.id);
  const holdFiles = coverage
    .filter((item) => {
      const group = ledger.groups.find((candidate) => candidate.id === item.groups[0]);
      return group?.status === 'hold';
    })
    .map((item) => item.path);
  const questionRefs = releaseQuestionReferences();
  const missingQuestionRefs = questionRefs.filter((path) => !existsSync(resolve(ROOT, path)));
  const fallbackBacklog = JSON.parse(readFileSync(resolve(ROOT, 'imports/asset-backlog.json'), 'utf8')) as {
    assets: { priority: number }[];
  };
  const tohokuMissingStaticReplacements = fallbackBacklog.assets.filter((item) => item.priority <= 2);
  const choiceSource = readFileSync(resolve(ROOT, 'src/questions/renderers/choice/ChoiceView.tsx'), 'utf8');
  const pictureWordSource = readFileSync(
    resolve(ROOT, 'src/questions/renderers/picture-word/PictureWordView.tsx'),
    'utf8',
  );
  const speechFallbackPresent = [choiceSource, pictureWordSource].every((source) =>
    source.includes('.catch(() => ctx.speak'),
  );
  const audioFiles = media.filter((path) =>
    ['.mp3', '.ogg', '.wav', '.m4a'].includes(extname(path).toLowerCase()),
  );
  const blockers = [
    ...(uncovered.length ? [`台帳未収載の配布素材 ${uncovered.length}件`] : []),
    ...(multiplyCovered.length ? [`複数グループに重複した素材 ${multiplyCovered.length}件`] : []),
    ...(missingDeclared.length ? [`台帳記載だが欠落した素材 ${missingDeclared.length}件`] : []),
    ...(hashMismatches.length ? [`承認済み素材のハッシュ不一致 ${hashMismatches.length}件`] : []),
    ...(invalidApprovals.length ? [`承認根拠が不完全なグループ ${invalidApprovals.length}件`] : []),
    ...(holdFiles.length ? [`権利未確認のまま配布物へ入る素材 ${holdFiles.length}件`] : []),
    ...(missingQuestionRefs.length ? [`問題から参照される欠落素材 ${missingQuestionRefs.length}件`] : []),
  ];
  return {
    schemaVersion: 1,
    scope: ledger.scope,
    decision: blockers.length === 0 ? 'GO' : 'NO-GO',
    counts: {
      distributedMedia: media.length,
      approvedMedia: media.length - holdFiles.length,
      holdMedia: holdFiles.length,
      questionMediaReferences: questionRefs.length,
      missingQuestionMediaReferences: missingQuestionRefs.length,
      tohokuMissingStaticReplacements: tohokuMissingStaticReplacements.length,
      audioFiles: audioFiles.length,
    },
    runtime: {
      assetsDirectoryCopiedWholeByVite: true,
      generatedPixelArt:
        'Phaser/TypeScript source generates field, character, monster and UI graphics at runtime',
      speechFallbackPresent,
      audioPolicy:
        audioFiles.length === 0 ? 'No bundled audio; Web Speech fallback only' : 'Bundled audio present',
    },
    blockers,
    uncovered,
    multiplyCovered,
    missingDeclared,
    hashMismatches,
    invalidApprovals,
    holdByGroup: Object.fromEntries(
      ledger.groups
        .filter((group) => group.status === 'hold')
        .map((group) => [group.id, media.filter((path) => groupFor(path, [group]).length).length]),
    ),
    questionRefs,
    missingQuestionRefs,
    tohokuMissingStaticReplacements,
  };
}

const invokedPath = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : '';
if (import.meta.url === invokedPath) {
  const report = await auditTohokuAssetsRights();
  if (process.argv.includes('--write'))
    writeFileSync(resolve(ROOT, REPORT), `${JSON.stringify(report, null, 2)}\n`);
  console.log(
    `tohoku assets rights: ${report.decision}; ${report.counts.approvedMedia}/${report.counts.distributedMedia} approved; ${report.blockers.join('; ') || 'blockers 0'}`,
  );
  if (
    report.uncovered.length ||
    report.multiplyCovered.length ||
    report.missingDeclared.length ||
    report.hashMismatches.length ||
    report.invalidApprovals.length
  )
    process.exitCode = 1;
}
