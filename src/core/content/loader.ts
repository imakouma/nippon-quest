/**
 * content/ の読み込み・検証・索引。ブラウザ（fetch）と Node（fs）の両方から使える。
 * 実ファイル一覧は content/manifest.json（`pnpm gen:manifest` が生成）に従う。
 */
import type { ZodTypeAny } from 'zod';
import {
  contentKinds,
  type Area,
  type ArenaRival,
  type ContentKind,
  type ElementTable,
  type EquipSet,
  type Item,
  type Monster,
  type Recipe,
  type Settings,
  type Skill,
  type Unit,
  type World,
  type XpTable,
} from './schemas';

export interface ContentManifest {
  generatedAt: string;
  files: Record<ContentKind, string[]>;
  questions: string[];
  /** Playground の ?q= 直リンクで全問題を読み込まず、該当ファイルだけ取得する索引。 */
  questionIndex?: Record<string, string>;
}

export type FileReader = (relPath: string) => Promise<unknown>;

export class ContentError extends Error {
  constructor(
    public readonly file: string,
    message: string,
  ) {
    super(`${file}: ${message}`);
    this.name = 'ContentError';
  }
}

export interface ContentIndex {
  world: World;
  areas: Map<string, Area>;
  monsters: Map<string, Monster>;
  items: Map<string, Item>;
  skills: Map<string, Skill>;
  recipes: Map<string, Recipe>;
  sets: Map<string, EquipSet>;
  units: Map<string, Unit>;
  rivals: Map<string, ArenaRival>;
  xp: XpTable;
  elements: ElementTable;
  settings: Settings;
  /** area id → その県のモンスター一覧（索引） */
  monstersByArea: Map<string, Monster[]>;
  questionFiles: string[];
}

/** fetch ベースの reader（ブラウザ用）。base は '/content' など */
export function fetchReader(base: string): FileReader {
  return async (rel) => {
    const res = await fetch(`${base}/${rel}`, { cache: 'no-cache' });
    if (!res.ok) throw new ContentError(rel, `HTTP ${res.status}`);
    return res.json();
  };
}

/** Browser reader optimized for game boot: one generated response instead of ~1,000 JSON requests. */
export function bundledFetchReader(base: string, bundleName = 'content-bundle.json'): FileReader {
  const fallback = fetchReader(base);
  let bundlePromise: Promise<Record<string, unknown> | null> | undefined;
  return async (rel) => {
    bundlePromise ??= fetch(`${base}/${bundleName}`, { cache: 'no-cache' })
      .then(async (res) => (res.ok ? ((await res.json()) as Record<string, unknown>) : null))
      .catch(() => null);
    const bundle = await bundlePromise;
    if (!bundle) return fallback(rel);
    if (!Object.prototype.hasOwnProperty.call(bundle, rel)) return fallback(rel);
    return bundle[rel];
  };
}

function parseWith<T>(schema: ZodTypeAny, data: unknown, file: string): T {
  const r = schema.safeParse(data);
  if (!r.success) {
    const issues = r.error.issues.map((i) => `  - ${i.path.join('.') || '(root)'}: ${i.message}`).join('\n');
    throw new ContentError(file, `スキーマ違反\n${issues}`);
  }
  return r.data as T;
}

async function loadKind<T extends { id: string }>(
  kind: ContentKind,
  manifest: ContentManifest,
  read: FileReader,
  onDuplicate: (id: string, file: string) => void,
): Promise<Map<string, T>> {
  const { schema, array } = contentKinds[kind];
  const map = new Map<string, T>();
  const files = manifest.files[kind] ?? [];
  // Fetch independent content files together. Reading hundreds of monster and
  // item files serially makes browser boot time scale with every HTTP round trip.
  // Promise.all preserves the manifest order, so duplicate handling stays deterministic.
  const raws = await Promise.all(files.map((file) => read(file)));
  for (let index = 0; index < files.length; index += 1) {
    const file = files[index]!;
    const raw = raws[index];
    const rows: unknown[] = array ? (Array.isArray(raw) ? raw : [raw]) : [raw];
    if (array && !Array.isArray(raw)) throw new ContentError(file, '配列である必要があります');
    for (const row of rows) {
      const parsed = parseWith<T>(schema, row, file);
      if (map.has(parsed.id)) onDuplicate(parsed.id, file);
      map.set(parsed.id, parsed);
    }
  }
  return map;
}

async function loadSingle<T>(kind: ContentKind, manifest: ContentManifest, read: FileReader): Promise<T> {
  const files = manifest.files[kind] ?? [];
  const file = files[0];
  if (!file) throw new ContentError(contentKinds[kind].glob, `必須ファイルがありません（${kind}）`);
  return parseWith<T>(contentKinds[kind].schema, await read(file), file);
}

export interface LoadOptions {
  /** 重複 id を見つけたときの扱い。既定はエラー */
  onDuplicate?: (id: string, file: string) => void;
}

export async function loadContent(read: FileReader, opts: LoadOptions = {}): Promise<ContentIndex> {
  const manifest = (await read('manifest.json')) as ContentManifest;
  if (!manifest?.files) throw new ContentError('manifest.json', '`pnpm gen:manifest` を実行してください');
  const dup =
    opts.onDuplicate ??
    ((id: string, file: string) => {
      throw new ContentError(file, `id "${id}" が重複しています`);
    });

  const [world, xp, elements, settings] = await Promise.all([
    loadSingle<World>('world', manifest, read),
    loadSingle<XpTable>('xp', manifest, read),
    loadSingle<ElementTable>('elements', manifest, read),
    loadSingle<Settings>('settings', manifest, read),
  ]);
  const [areas, monsters, items, skills, recipes, sets, units, rivals] = await Promise.all([
    loadKind<Area>('prefectures', manifest, read, dup),
    loadKind<Monster>('monsters', manifest, read, dup),
    loadKind<Item>('items', manifest, read, dup),
    loadKind<Skill>('skills', manifest, read, dup),
    loadKind<Recipe>('recipes', manifest, read, dup),
    loadKind<EquipSet>('sets', manifest, read, dup),
    loadKind<Unit>('units', manifest, read, dup),
    loadKind<ArenaRival>('rivals', manifest, read, dup),
  ]);

  const monstersByArea = new Map<string, Monster[]>();
  for (const m of monsters.values()) {
    const list = monstersByArea.get(m.area) ?? [];
    list.push(m);
    monstersByArea.set(m.area, list);
  }

  return {
    world,
    areas,
    monsters,
    items,
    skills,
    recipes,
    sets,
    units,
    rivals,
    xp,
    elements,
    settings,
    monstersByArea,
    questionFiles: manifest.questions ?? [],
  };
}

/** 参照整合性チェック。validate-content と実行時の両方で使う */
export function findBrokenReferences(c: ContentIndex): string[] {
  const errs: string[] = [];
  const has = (m: Map<string, unknown>, id: string | undefined) => id === undefined || m.has(id);

  for (const island of c.world.islands) {
    for (const a of island.areas)
      if (!c.areas.has(a)) errs.push(`world: island "${island.id}" の area "${a}" が存在しません`);
    if (island.status === 'playable' && !c.monsters.has(island.bossId))
      errs.push(`world: island "${island.id}" の bossId "${island.bossId}" が存在しません`);
  }
  for (const a of c.areas.values()) {
    if (!c.world.islands.some((i) => i.id === a.island))
      errs.push(`area "${a.id}": island "${a.island}" が world にありません`);
    if (!has(c.monsters, a.boss)) errs.push(`area "${a.id}": boss "${a.boss}" が存在しません`);
    if (!has(c.monsters, a.midBoss)) errs.push(`area "${a.id}": midBoss "${a.midBoss}" が存在しません`);
    if (a.secret && !c.monsters.get(a.secret.boss)?.isBoss)
      errs.push(`area "${a.id}": secret.boss "${a.secret.boss}" が無いか、isBoss: true ではありません`);
    else if (a.midBoss && !c.monsters.get(a.midBoss)!.isBoss)
      errs.push(
        `area "${a.id}": midBoss "${a.midBoss}" は isBoss: true にしてください（にげられない戦いにする）`,
      );
    const motifIds = new Set(a.motifs.map((m) => m.id));
    for (const e of a.encounters)
      for (const t of e.table)
        if (!c.monsters.has(t.monsterId))
          errs.push(`area "${a.id}": encounter "${t.monsterId}" が存在しません`);
    for (const s of a.shop)
      if (!c.items.has(s.itemId)) errs.push(`area "${a.id}": shop "${s.itemId}" が存在しません`);
    for (const ev of a.events) {
      if (!motifIds.has(ev.motifId))
        errs.push(
          `area "${a.id}": event "${ev.id}" の motifId "${ev.motifId}" がこの県の motifs にありません`,
        );
      for (const r of ev.rewardByScore)
        errs.push(...checkReward(r.reward, c, `area "${a.id}" event "${ev.id}"`));
    }
    const npcIds = new Set((a.town?.npcs ?? []).map((n) => n.id));
    for (const ms of a.missions) {
      if (!npcIds.has(ms.giverNpc))
        errs.push(
          `area "${a.id}": mission "${ms.id}" の giverNpc "${ms.giverNpc}" が town.npcs にありません`,
        );
      errs.push(...checkReward(ms.reward, c, `area "${a.id}" mission "${ms.id}"`));
      const [kind, target] = ms.condition.split(':');
      if ((kind === 'defeat' || kind === 'recruit') && target && !c.monsters.has(target))
        errs.push(`area "${a.id}": mission "${ms.id}" の対象モンスター "${target}" が存在しません`);
      if (kind === 'collect' && target && !c.items.has(target))
        errs.push(`area "${a.id}": mission "${ms.id}" の対象アイテム "${target}" が存在しません`);
      if (kind === 'event' && target && !a.events.some((e) => e.id === target))
        errs.push(`area "${a.id}": mission "${ms.id}" の対象イベント "${target}" が存在しません`);
    }
  }
  for (const m of c.monsters.values()) {
    // area は都道府県 id。地方ボスだけは島 id を指定できる（モチーフは複数県にまたがるので motif 検証を省く）
    const area = c.areas.get(m.area);
    const island = c.world.islands.find((i) => i.id === m.area);
    if (!area && !island) errs.push(`monster "${m.id}": area "${m.area}" が存在しません`);
    // 北海道のように 県 id と 島 id が 同じ ときは 県あつかい（島 id だけの モンスターは 地方ボスのみ）
    else if (!area && !m.isBoss) errs.push(`monster "${m.id}": 島 id を area にできるのは isBoss のみ`);
    else if (area && !area.motifs.some((x) => x.id === m.motifId))
      errs.push(`monster "${m.id}": motifId "${m.motifId}" が ${m.area} の motifs にありません`);
    for (const s of m.skills)
      if (!c.skills.has(s)) errs.push(`monster "${m.id}": skill "${s}" が存在しません`);
    for (const d of m.drops)
      if (!c.items.has(d.itemId)) errs.push(`monster "${m.id}": drop "${d.itemId}" が存在しません`);
    if (!has(c.items, m.recruitItem))
      errs.push(`monster "${m.id}": recruitItem "${m.recruitItem}" が存在しません`);
    for (const p of m.bossPhases ?? [])
      for (const s of p.skills ?? [])
        if (!c.skills.has(s)) errs.push(`monster "${m.id}": phase skill "${s}" が存在しません`);
    if (m.evolution && !c.monsters.has(m.evolution.to))
      errs.push(`monster "${m.id}": evolution.to "${m.evolution.to}" が存在しません`);
    if (m.evolution && !c.items.has(m.evolution.item))
      errs.push(`monster "${m.id}": evolution.item "${m.evolution.item}" が存在しません`);
  }
  for (const it of c.items.values()) {
    if (!has(c.skills, it.grantsSkill))
      errs.push(`item "${it.id}": grantsSkill "${it.grantsSkill}" が存在しません`);
    if (!has(c.sets, it.setId)) errs.push(`item "${it.id}": setId "${it.setId}" が存在しません`);
    if (!has(c.areas, it.areaOrigin))
      errs.push(`item "${it.id}": areaOrigin "${it.areaOrigin}" が存在しません`);
  }
  for (const s of c.sets.values())
    for (const p of s.pieces) if (!c.items.has(p)) errs.push(`set "${s.id}": piece "${p}" が存在しません`);
  for (const r of c.recipes.values()) {
    if (!c.items.has(r.result.itemId))
      errs.push(`recipe "${r.id}": result "${r.result.itemId}" が存在しません`);
    for (const m of r.materials)
      if (!c.items.has(m.itemId)) errs.push(`recipe "${r.id}": material "${m.itemId}" が存在しません`);
  }
  for (const sk of c.skills.values()) {
    for (const u of sk.unitHint ?? [])
      if (!c.units.has(u)) errs.push(`skill "${sk.id}": unitHint "${u}" が units.json にありません`);
    if (sk.costGauge > c.settings.subjectGauge.max)
      errs.push(
        `skill "${sk.id}": costGauge ${sk.costGauge} が 教科ゲージの 上限 ${c.settings.subjectGauge.max} を こえています`,
      );
  }
  for (const [subject, id] of Object.entries(c.settings.subjectGauge.uniqueSkills)) {
    const sk = id ? c.skills.get(id) : undefined;
    if (!sk) errs.push(`settings.subjectGauge.uniqueSkills.${subject}: skill "${id}" が存在しません`);
    else if (sk.subject !== subject)
      errs.push(`settings.subjectGauge.uniqueSkills.${subject}: skill "${id}" の 教科が ${sk.subject} です`);
  }
  for (const rv of c.rivals.values()) {
    for (const m of rv.monsters)
      if (!c.monsters.has(m.monsterId))
        errs.push(`rival "${rv.id}": monster "${m.monsterId}" が存在しません`);
    for (const id of Object.values(rv.equipment))
      if (id && !c.items.has(id)) errs.push(`rival "${rv.id}": equipment "${id}" が存在しません`);
  }
  return errs;
}

function checkReward(
  r: { items?: { itemId: string }[]; skills?: string[]; recipes?: string[]; unlockMonsters?: string[] },
  c: ContentIndex,
  where: string,
): string[] {
  const errs: string[] = [];
  for (const i of r.items ?? [])
    if (!c.items.has(i.itemId)) errs.push(`${where}: reward item "${i.itemId}" が存在しません`);
  for (const s of r.skills ?? [])
    if (!c.skills.has(s)) errs.push(`${where}: reward skill "${s}" が存在しません`);
  for (const rc of r.recipes ?? [])
    if (!c.recipes.has(rc)) errs.push(`${where}: reward recipe "${rc}" が存在しません`);
  for (const m of r.unlockMonsters ?? [])
    if (!c.monsters.has(m)) errs.push(`${where}: reward unlockMonsters "${m}" が存在しません`);
  return errs;
}
