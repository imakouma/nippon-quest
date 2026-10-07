import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';

const TOHOKU = new Set(['aomori', 'iwate', 'miyagi', 'akita', 'yamagata', 'fukushima']);

const readJson = async (path) => JSON.parse(await readFile(path, 'utf8'));
const assetBacklog = await readJson('imports/asset-backlog.json');
const reviewQueue = await readJson('imports/academic-review-queue.json');
const reviewLedger = await readJson('content/quality/academic-reviews.json');

const tohokuAssets = assetBacklog.assets.filter((asset) => TOHOKU.has(asset.area));
const blockers = [];

if (reviewQueue.summary.pendingFiles > 0) {
  blockers.push(
    `未承認教材: ${reviewQueue.summary.pendingFiles}ファイル / ${reviewQueue.summary.pendingQuestions}問`,
  );
}
if (tohokuAssets.length > 0) {
  blockers.push(`東北の未完成静的素材: ${tohokuAssets.length}件`);
}
if (!Array.isArray(reviewLedger.reviews) || reviewLedger.reviews.length === 0) {
  blockers.push('教材承認記録: 0件');
}

const evidence = {
  verdict: blockers.length === 0 ? 'GO' : 'NO-GO',
  blockers,
  academic: reviewQueue.summary,
  approvedReviewRecords: reviewLedger.reviews.length,
  tohokuPendingAssets: {
    total: tohokuAssets.length,
    byArea: Object.fromEntries(
      [...TOHOKU].map((area) => [area, tohokuAssets.filter((asset) => asset.area === area).length]),
    ),
  },
  inputDigests: {
    assetBacklogSha256: createHash('sha256')
      .update(await readFile('imports/asset-backlog.json'))
      .digest('hex'),
    academicQueueSha256: createHash('sha256')
      .update(await readFile('imports/academic-review-queue.json'))
      .digest('hex'),
  },
};

console.log(JSON.stringify(evidence, null, 2));
if (blockers.length > 0) process.exitCode = 2;
