/**
 * 必殺技の 見た目を、技の タイプ・教科・単元 から きめる（純粋関数。Phaser を つかわない）。
 *  - タイプ（effect）：こうげき（attack）・まもり（barrier）・かいふく（heal）・しらべる（scan）・よわらせる（weaken）
 *  - 教科（subject）：演出の しかた（style）と 色・かけら
 *      国語＝筆で 字を 書く（write）／算数＝式が ならんで こたえが ドン（equation）／理科＝じっけん（lab）／
 *      社会＝はんこを おす（stamp）／生活＝きせつの 花や 葉（nature）／英語＝ふきだしで さけぶ（speech）
 *  - 技の 名前に あう 字（skillFx.skill.<技の id>）が あれば それだけを つかう（ほのおのまい＝「炎」）。
 *    「炎[ほのお]」のように 読みを つけると、きめの 大きな 字の 上に 小さく 読みが 出る（ならっていない 漢字でも 読める）
 *  - 単元（unitHint）：とぶ 字や 式（content/i18n/ja.json の skillFx.unit.<単元の . を _ に>。無ければ 教科の skillFx.subject.<教科>）
 *    例：たしざん「3＋4＝7」、九九「7×8＝56」、ひらがな「あいうえお」、光「☆ ◎」、地図記号「〒 文」、くだもの「APPLE!」
 * 演出そのものは motions.ts の subject*（ため・とぶ・きめ）。
 */
import type { Skill } from '../../core/content/schemas';
import type { FxKind } from './fxArt';

export type SkillKind = 'attack' | 'barrier' | 'heal' | 'scan' | 'weaken';
export type SubjectStyle = 'write' | 'equation' | 'lab' | 'stamp' | 'nature' | 'speech';

export interface SkillLook {
  kind: SkillKind;
  style: SubjectStyle;
  /** とぶ 字（1〜2 文字の みじかい もの） */
  glyphs: string[];
  /** きめで 大きく 出す ことば（式・かんじ・えいご）。じゅんばんに つかう */
  big: string[];
  /** 字の 読み（「炎[ほのお]」の 炎 → ほのお）。きめの 大きな 字の 上に 小さく 出す */
  reading: Readonly<Record<string, string>>;
  /** 字の 色（NQ-48 の 色コード） */
  color: string;
  /** 字の ふちの 色 */
  edge: string;
  /** 技の 属性の 色（国語の きめの 大きな 字。ほのお なら 赤い「炎」） */
  accent: string;
  /** まわりに ちらす かけら（色つき） */
  bits: { fx: FxKind; tint: number }[];
  /** 単元ごとの 追加の 演出（光の 単元は にじの 光、水の すがたは こおりと ゆげ …） */
  extra: 'prism' | 'ice' | 'map' | 'season' | 'creature' | null;
}

const SUBJECT: Record<
  Skill['subject'],
  { style: SubjectStyle; color: string; edge: string; bits: SkillLook['bits'] }
> = {
  // 国語：すみの 黒と 朱色。すみの しぶき
  kokugo: {
    style: 'write',
    color: '#ffffff',
    edge: '#1a1428',
    bits: [
      { fx: 'wisp', tint: 0x2e2a45 },
      { fx: 'twinkle', tint: 0xe5484d },
    ],
  },
  // 算数：あおい 黒板の チョーク
  sansu: {
    style: 'equation',
    color: '#fff3a3',
    edge: '#1f4fa3',
    bits: [
      { fx: 'twinkle', tint: 0xffd23f },
      { fx: 'twinkle', tint: 0x80c6ff },
    ],
  },
  // 理科：フラスコの あわ
  rika: {
    style: 'lab',
    color: '#a4f0e2',
    edge: '#2c8b80',
    bits: [
      { fx: 'bubble', tint: 0xa4f0e2 },
      { fx: 'twinkle', tint: 0x58d0bd },
    ],
  },
  // 社会：朱肉の はんこ
  shakai: {
    style: 'stamp',
    color: '#ffffff',
    edge: '#a8341f',
    bits: [
      { fx: 'pebble', tint: 0xc08a55 },
      { fx: 'twinkle', tint: 0xf0603c },
    ],
  },
  // 生活：花と 葉
  seikatsu: {
    style: 'nature',
    color: '#ffffff',
    edge: '#2a7a36',
    bits: [
      { fx: 'leafbit', tint: 0xff8fb1 },
      { fx: 'leafbit', tint: 0x4cbf4c },
    ],
  },
  // 英語：カラフルな ふきだし
  eigo: {
    style: 'speech',
    color: '#ffffff',
    edge: '#6e4fc4',
    bits: [
      { fx: 'twinkle', tint: 0xa28be6 },
      { fx: 'twinkle', tint: 0xff9e5e },
    ],
  },
};

/** 属性の 色（NQ-48） */
const ELEMENT_COLOR: Record<Skill['element'], string> = {
  hino: '#f0603c',
  mizu: '#80c6ff',
  mori: '#8fe36f',
  tsuchi: '#e2b27a',
  kaze: '#a4f0e2',
  hikari: '#ffd23f',
  yami: '#a28be6',
  none: '#ffffff',
};

/** 単元 → 追加の 演出 */
const UNIT_EXTRA: Readonly<Record<string, SkillLook['extra']>> = {
  'rika.g3.hikari': 'prism',
  'rika.g4.mizu-no-sugata': 'ice',
  'shakai.g3.machi': 'map',
  'shakai.g4.todofuken': 'map',
  'seikatsu.g1.kisetsu': 'season',
  'seikatsu.g2.ikimono': 'creature',
};

/** i18n の キー（単元 id の . は キーの 区切りと まざるので _ に） */
export const unitFxKey = (unit: string): string => `skillFx.unit.${unit.replace(/\./g, '_')}`;
export const subjectFxKey = (subject: string): string => `skillFx.subject.${subject}`;
export const skillFxKey = (skillId: string): string => `skillFx.skill.${skillId}`;

function kindOf(sk: Pick<Skill, 'effect' | 'targetType'>): SkillKind {
  switch (sk.effect) {
    case 'heal':
      return 'heal';
    case 'buff':
      return 'barrier';
    case 'scan':
      return 'scan';
    case 'debuff':
    case 'status':
      return 'weaken';
    default:
      return 'attack';
  }
}

/**
 * 技の 見た目。text は i18n の 文言を ひく 関数（ゲームでは tOpt、テストでは ja.json を ひく）。
 * 字の ことばは スペースで 区切る。1〜2 文字は とぶ 字、それより 長い（式・ことば）は きめの 字
 */
export function skillLook(
  sk: Pick<Skill, 'id' | 'subject' | 'unitHint' | 'effect' | 'targetType' | 'element'>,
  text: (key: string) => string | undefined,
): SkillLook {
  const sub = SUBJECT[sk.subject];
  const units = sk.unitHint ?? [];
  const split = (v: string | undefined) => (v ?? '').split(/\s+/).filter(Boolean);
  // 技の 名前に あう 字 → 単元の 字 → 教科の 字 の じゅん
  const own = split(text(skillFxKey(sk.id)));
  const words = own.length ? own : units.flatMap((u) => split(text(unitFxKey(u))));
  const raw = words.length ? words : split(text(subjectFxKey(sk.subject)));
  // 「炎[ほのお]」→ 字は 炎、読みは ほのお
  const reading: Record<string, string> = {};
  const pool = raw.map((w) => {
    const m = /^(.+)\[(.+)\]$/.exec(w);
    if (!m) return w;
    reading[m[1]!] = m[2]!;
    return m[1]!;
  });
  const glyphs = pool.filter((w) => [...w].length <= 2);
  const big = pool.filter((w) => [...w].length > 2);
  return {
    kind: kindOf(sk),
    style: sub.style,
    glyphs: glyphs.length ? glyphs : pool,
    big: big.length ? big : glyphs.slice(0, 1),
    reading,
    color: sub.color,
    edge: sub.edge,
    accent: ELEMENT_COLOR[sk.element],
    bits: sub.bits,
    extra: units.map((u) => UNIT_EXTRA[u]).find((x) => !!x) ?? null,
  };
}
