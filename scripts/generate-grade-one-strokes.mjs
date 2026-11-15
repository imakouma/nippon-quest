import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { svgPathProperties } from 'svg-path-properties';

const source = process.argv[2];
assert(source, 'Pass the pinned KanjiVG checkout directory (610091c).');
const grades = JSON.parse(readFileSync('content/i18n/kanji-grades.json', 'utf8'));
const characters = {};
for (const kanji of grades.byGrade['1']) {
  const file = `${kanji.codePointAt(0).toString(16).padStart(5, '0')}.svg`;
  const svg = readFileSync(join(source, 'kanji', file), 'utf8');
  const strokes = [...svg.matchAll(/<path\s[^>]*kvg:type="([^"]+)"[^>]*d="([^"]+)"[^>]*\/>/g)];
  assert(strokes.length > 0, `Missing strokes: ${kanji}`);
  characters[kanji] = strokes.map(([, type, path]) => {
    const geometry = new svgPathProperties(path);
    const length = geometry.getTotalLength();
    assert(length > 0);
    const points = Array.from({ length: 64 }, (_, index) => {
      const point = geometry.getPointAtLength((index / 63) * length);
      assert(Number.isFinite(point.x) && Number.isFinite(point.y));
      return { x: Number((point.x / 109).toFixed(5)), y: Number((point.y / 109).toFixed(5)) };
    });
    return { type, points };
  });
}
assert.equal(Object.keys(characters).length, 80);
writeFileSync(
  'content/kanji/grade-one-strokes.json',
  JSON.stringify({
    source: 'https://github.com/KanjiVG/kanjivg/tree/610091c',
    copyright: 'Copyright (C) 2009/2010/2011 Ulrich Apel and KanjiVG contributors',
    license: 'CC-BY-SA-3.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/3.0/',
    modification: 'Grade-one subset; SVG paths sampled into 64 normalized points per stroke.',
    recognizer: {
      package: 'kanji-recognizer@0.2.0',
      license: 'MIT',
      notice: readFileSync('node_modules/kanji-recognizer/LICENSE', 'utf8'),
    },
    characters,
  }),
);
console.log(`Generated ${Object.keys(characters).length} characters`);
