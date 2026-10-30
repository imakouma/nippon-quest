import { readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, relative, resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';

export interface AnimationContactSheetEntry {
  id: string;
  sourcePath: string;
  runtimePath: string;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function renderAnimationContactSheet(entries: AnimationContactSheetEntry[]): string {
  const cards = entries
    .map((entry) => {
      const id = escapeHtml(entry.id);
      const source = escapeHtml(entry.sourcePath);
      const runtime = escapeHtml(entry.runtimePath);
      return `
        <article>
          <h2>${id}</h2>
          <figure><figcaption>accepted source</figcaption><img src="${source}" alt="${id} accepted source"></figure>
          <figure data-scale="1"><figcaption>runtime 1×</figcaption><img src="${runtime}" width="512" height="256" alt="${id} runtime sheet at native scale"></figure>
          <figure data-scale="2"><figcaption>runtime 2×</figcaption><img src="${runtime}" width="1024" height="512" alt="${id} runtime sheet enlarged"></figure>
        </article>`;
    })
    .join('\n');

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Runtime monster animation contact sheet</title>
  <style>
    :root { color-scheme: dark; font-family: ui-monospace, monospace; }
    body { margin: 24px; background: #171717; color: #f5f5f5; }
    main { display: grid; gap: 32px; }
    article { overflow: auto; padding: 16px; border: 1px solid #555; background: #222; }
    figure { width: max-content; margin: 12px 0; padding: 8px; background: repeating-conic-gradient(#444 0 25%, #333 0 50%) 0 / 16px 16px; }
    figcaption { margin-bottom: 8px; padding: 4px; background: #111; }
    img { display: block; max-width: none; image-rendering: pixelated; }
  </style>
</head>
<body>
  <h1>Runtime monster animation contact sheet</h1>
  <main>${cards}
  </main>
</body>
</html>
`;
}

function main(): void {
  const ledgerPath =
    process.argv[2] ?? 'docs/verification/animation-completion/runtime-monsters/production-ledger.json';
  const outputPath =
    process.argv[3] ?? 'docs/verification/animation-completion/runtime-monsters/contact-sheet.html';
  const ledger = JSON.parse(readFileSync(ledgerPath, 'utf8')) as {
    entries: {
      id: string;
      state: string;
      generatedSource?: { path: string };
      runtimeOutput?: { path: string };
    }[];
  };
  const entries = ledger.entries
    .filter((entry) => entry.state === 'accepted' && entry.generatedSource?.path && entry.runtimeOutput?.path)
    .map((entry) => ({
      id: entry.id,
      sourcePath: basename(entry.generatedSource!.path),
      runtimePath: relative(dirname(outputPath), entry.runtimeOutput!.path).replaceAll(sep, '/'),
    }));
  writeFileSync(outputPath, renderAnimationContactSheet(entries));
  console.log(`animation contact sheet: ${entries.length} accepted entries`);
}

const invokedPath = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : '';
if (import.meta.url === invokedPath) main();
