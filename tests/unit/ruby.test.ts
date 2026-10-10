import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  displayRuby,
  displayText,
  kanjiGradeTable,
  openKanjiAboveGrade,
  parseRuby,
  setKanjiLevel,
  stripRuby,
} from '../../src/ui/ruby';

const readJson = <T>(path: string): T =>
  JSON.parse(readFileSync(new URL(`../../content/i18n/${path}`, import.meta.url), 'utf8')) as T;
const grades = readJson<{ byGrade: Record<string, string> }>('kanji-grades.json').byGrade;
const properNouns = readJson<{ names: string[] }>('proper-nouns.json').names;
const ja = readJson<Record<string, unknown>>('ja.json');

function collectStrings(value: unknown, path: string[] = []): Array<{ path: string; text: string }> {
  if (typeof value === 'string') return [{ path: path.join('.'), text: value }];
  if (!value || typeof value !== 'object') return [];
  return Object.entries(value).flatMap(([key, child]) => collectStrings(child, [...path, key]));
}

const hasBareKanji = (text: string): boolean => {
  const withoutRuby = text.replace(/[一-鿿々〆ヶ]+\[[ぁ-ゖァ-ヺー・]+\]/g, '');
  return /[一-鿿々〆ヶ]|[[\]]/.test(withoutRuby);
};

const isSafeLegacyRubyCandidate = (text: string): boolean =>
  hasBareKanji(text) &&
  !text.includes('[') &&
  !/<\/?(?:ruby|rt|rp|br)\b/i.test(text) &&
  !/[一-鿿々〆ヶ]+[（(][ぁ-ゖァ-ヺー・]+[）)]/.test(text) &&
  !/(?:なんと|何と)?(?:読む|よむ|読み方|よみかた|読み|よみ)(?:ますか|でしょう|は|を|？|\?)/.test(text);

const displayFields = new Set([
  'name',
  'text',
  'blurb',
  'title',
  'hint',
  'line',
  'intro',
  'description',
  'flavor',
  'speaker',
  'capital',
  'fieldLine',
  'prompt',
  'explanation',
  'label',
  'result',
  'question',
]);

function jsonFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const file = join(dir, entry.name);
    return entry.isDirectory() ? jsonFiles(file) : entry.name.endsWith('.json') ? [file] : [];
  });
}

function collectDisplayStrings(
  value: unknown,
  file: string,
  path: string[] = [],
): Array<{ file: string; path: string; text: string }> {
  if (!value || typeof value !== 'object') return [];
  if (!Array.isArray(value) && 'subject' in value && (value as { subject?: unknown }).subject === 'kokugo')
    return [];
  return Object.entries(value).flatMap(([key, child]) => {
    const nextPath = [...path, key];
    if (typeof child === 'string' && displayFields.has(key))
      return [{ file, path: nextPath.join('.'), text: child }];
    return collectDisplayStrings(child, file, nextPath);
  });
}

describe('漢字表示レベル（まだ習っていない漢字の ことばは、ルビではなく ひらがなで出す）', () => {
  const table = kanjiGradeTable(grades);
  afterEach(() => setKanjiLevel(null));

  it('学年別漢字配当表は 2020 年度からの 1026 字（80・160・200・202・193・191 字）で、重なりがない', () => {
    expect(Object.values(grades).map((s) => [...s].length)).toEqual([80, 160, 200, 202, 193, 191]);
    expect(Object.keys(table)).toHaveLength(1026);
    expect(table['湖']).toBe(3);
    expect(table['潟']).toBe(4);
  });

  it('習っていない漢字の ことばは ひらがな、習った漢字は 漢字＋ルビ', () => {
    setKanjiLevel({ grade: 2, table, names: new Set() });
    expect(displayRuby('海[うみ]と 湖[みずうみ]')).toEqual([
      { base: '海', ruby: 'うみ' },
      { base: 'と ' },
      { base: 'みずうみ' },
    ]);
    // ことばの中に 1 字でも 習っていない漢字があれば、まぜ書きにせず ことばごと ひらがな
    expect(displayText('世界遺産[せかいいさん]')).toBe('せかいいさん');
  });

  it('地名・名前（proper-nouns.json・〇〇市 など）は 習っていなくても 漢字＋ルビのまま', () => {
    setKanjiLevel({ grade: 1, table, names: new Set(properNouns) });
    expect(displayRuby('十和田湖[とわだこ]')).toEqual([{ base: '十和田湖', ruby: 'とわだこ' }]);
    expect(displayRuby('中部[ちゅうぶ]')).toEqual([{ base: '中部', ruby: 'ちゅうぶ' }]);
    expect(displayRuby('夕張市[ゆうばりし]')).toEqual([{ base: '夕張市', ruby: 'ゆうばりし' }]);
    expect(displayText('城下町[じょうかまち]')).toBe('じょうかまち');
  });

  it('ルビの無い漢字（問題で問う漢字など）は、いつも そのまま', () => {
    setKanjiLevel({ grade: 1, table, names: new Set() });
    expect(displayText('「湖」の よみかたは？')).toBe('「湖」の よみかたは？');
  });

  it('「々」は 前の漢字と同じ学年あつかい', () => {
    setKanjiLevel({ grade: 1, table, names: new Set() });
    expect(displayRuby('山々[やまやま]')).toEqual([{ base: '山々', ruby: 'やまやま' }]);
  });

  it('漢字表示レベルが無い（ゲームが始まる前）ときは 開かない', () => {
    expect(displayText('遺跡[いせき]')).toBe('遺跡');
  });

  it('proper-nouns.json は 漢字 2 字以上の ことばだけ', () => {
    expect(properNouns.filter((n) => !/^[一-鿿々〆ヶ]{2,}$/.test(n))).toEqual([]);
    expect(new Set(properNouns).size).toBe(properNouns.length);
  });
});

describe('RubyText', () => {
  it('通常画面の操作案内にPCキー名を常設しない', () => {
    const dictionary = ja as {
      saveSlots: { keyboardHint: string };
      field: {
        townShopKeys: string;
        townSmithKeys: string;
        townBoardKeys: string;
        mapKeys: string;
        mapNationKeys: string;
        areaMapKeys: string;
        menuKeys: string;
        barberKeys: string;
        lookSummary: string;
      };
    };
    const visibleControlHints = [
      dictionary.saveSlots.keyboardHint,
      dictionary.field.townShopKeys,
      dictionary.field.townSmithKeys,
      dictionary.field.townBoardKeys,
      dictionary.field.mapKeys,
      dictionary.field.mapNationKeys,
      dictionary.field.areaMapKeys,
      dictionary.field.menuKeys,
      dictionary.field.barberKeys,
      dictionary.field.lookSummary,
    ];

    expect(
      visibleControlHints.filter((text) => /[↑↓←→]|\b(?:Enter|Esc|Space)\b|\b[ZX]\b/.test(text)),
    ).toEqual([]);
  });

  it('ゲーム画面の共通文言は、演出専用文字を除いて漢字を読みなしで残さない', () => {
    const visibleDictionary = Object.fromEntries(Object.entries(ja).filter(([key]) => key !== 'skillFx'));
    const bare = collectStrings(visibleDictionary).filter(
      ({ path, text }) => !path.split('.').some((key) => key.startsWith('_')) && hasBareKanji(text),
    );
    expect(bare).toEqual([]);
  });

  it('ゲーム本編の表示データは、漢字問題を除いて漢字を読みなしで残さない', () => {
    const contentRoot = new URL('../../content/', import.meta.url);
    const rootPath = decodeURIComponent(contentRoot.pathname);
    const fixedFiles = ['units.json', 'recipes.json', 'sets.json', 'skills.json'].map((file) =>
      join(rootPath, file),
    );
    const folders = ['arena', 'curriculum', 'items', 'monsters', 'prefectures', 'world'];
    const questionFiles = jsonFiles(join(rootPath, 'questions')).filter(
      (file) => !file.includes('/kokugo/') && !file.includes('/legacy/'),
    );
    const files = [
      ...fixedFiles,
      ...folders.flatMap((folder) => jsonFiles(join(rootPath, folder))),
      ...questionFiles,
    ];
    const bare = files.flatMap((file) => {
      const data = JSON.parse(readFileSync(file, 'utf8')) as unknown;
      return collectDisplayStrings(data, relative(rootPath, file)).filter(({ text }) => hasBareKanji(text));
    });
    expect(bare).toEqual([]);
  });

  it('旧教材も、読みが検証できた通常語は RubyText にし、出題意図のある表記は保護する', () => {
    const contentRoot = new URL('../../content/', import.meta.url);
    const rootPath = decodeURIComponent(contentRoot.pathname);
    const legacyRoot = join(rootPath, 'questions', 'legacy');
    const files = ['sansu', 'rika', 'seikatsu', 'shakai'].flatMap((subject) =>
      jsonFiles(join(legacyRoot, subject)),
    );
    const strings = files.flatMap((file) => {
      const data = JSON.parse(readFileSync(file, 'utf8')) as unknown;
      return collectDisplayStrings(data, relative(rootPath, file));
    });
    const verifiedTerms = [
      '四角形',
      '三角形',
      '長方形',
      '正方形',
      '太陽',
      '面積',
      '北海道',
      '横断歩道',
      '学校',
      '家族',
    ];
    const stillBare = strings.filter(({ text }) => {
      const withoutRuby = text.replace(/[一-鿿々〆ヶ]+\[[ぁ-ゖァ-ヺー・]+\]/g, '');
      return (
        isSafeLegacyRubyCandidate(text) &&
        verifiedTerms.some((term) =>
          new RegExp(`(^|[^一-鿿々〆ヶ])${term}($|[^一-鿿々〆ヶ])`).test(withoutRuby),
        )
      );
    });
    expect(stillBare).toEqual([]);

    const protectedSource = readFileSync(join(legacyRoot, 'shakai', 'g4.json'), 'utf8');
    expect(protectedSource).toContain('雨温図（うおんず）');
    expect(protectedSource).toContain('経線（けいせん）');

    const kokugoSource = readFileSync(join(legacyRoot, 'kokugo', 'g2.json'), 'utf8');
    expect(kokugoSource).not.toContain('漢字[かんじ]');
  });

  it('漢字[よみ] を分解する', () => {
    expect(parseRuby('青森[あおもり]の りんご')).toEqual([
      { base: '青森', ruby: 'あおもり' },
      { base: 'の りんご' },
    ]);
  });
  it('複数のルビ', () => {
    expect(parseRuby('三内丸山遺跡[さんないまるやまいせき]と 恐山[おそれざん]')).toHaveLength(3);
  });
  it('ルビ無しはそのまま', () => {
    expect(parseRuby('ひらがなだけ')).toEqual([{ base: 'ひらがなだけ' }]);
  });
  it('stripRuby kana は読み仮名に開く', () => {
    expect(stripRuby('青森[あおもり]の 海[うみ]', 'kana')).toBe('あおもりの うみ');
    expect(stripRuby('青森[あおもり]の 海[うみ]')).toBe('青森の 海');
  });
  it('配当学年より上の漢字はかなに開く', () => {
    const table = { 海: 2, 遺: 6 };
    const segs = parseRuby('海[うみ]と 遺跡[いせき]');
    const opened = openKanjiAboveGrade(segs, 3, table);
    expect(opened[0]).toEqual({ base: '海', ruby: 'うみ' });
    expect(opened[2]).toEqual({ base: 'いせき' });
  });
});
