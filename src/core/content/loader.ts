/**
 * content/ の読み込み・検証・索引。ブラウザ（fetch）と Node（fs）の両方から使える。
 * 実ファイル一覧は content/manifest.json（`pnpm gen:manifest` が生成）に従う。
 */
import { z, type ZodTypeAny } from 'zod';
import {
  contentKinds,
  elementSchema,
  equipKinds,
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
import { checkRewardReferences } from './rewardValidation';

export interface ContentManifest {
  generatedAt: string;
  files: Record<ContentKind, string[]>;
  questions: string[];
  /** Playground の ?q= 直リンクで全問題を読み込まず、該当ファイルだけ取得する索引。 */
  questionIndex?: Record<string, string>;
  /** ゲーム開始時に選択学年だけ読み込むための索引。 */
  questionFilesByGrade?: Record<string, string[]>;
}

const contentManifestSchema = z.object({
  generatedAt: z.string(),
  files: z.record(z.array(z.string().min(1))),
  questions: z.array(z.string().min(1)),
  questionIndex: z.record(z.string().min(1)).optional(),
  questionFilesByGrade: z.record(z.array(z.string().min(1))).optional(),
});

export function parseContentManifest(data: unknown): ContentManifest {
  return parseWith<ContentManifest>(contentManifestSchema, data, 'manifest.json');
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
  /** 報酬を受け取るまで通常エンカウントから除外するモンスター。 */
  unlockableMonsters: ReadonlySet<string>;
  /** area id → その県のモンスター一覧（索引） */
  monstersByArea: Map<string, Monster[]>;
  questionFiles: string[];
  questionFilesByGrade?: Record<string, string[]>;
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
  if (files.length > 1)
    throw new ContentError('manifest.json', `${kind} は1ファイルだけ指定してください（${files.length}件）`);
  return parseWith<T>(contentKinds[kind].schema, await read(file), file);
}

export interface LoadOptions {
  /** 重複 id を見つけたときの扱い。既定はエラー */
  onDuplicate?: (id: string, file: string) => void;
}

export async function loadContent(read: FileReader, opts: LoadOptions = {}): Promise<ContentIndex> {
  const manifest = parseContentManifest(await read('manifest.json'));
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
  const unlockableMonsters = new Set<string>();
  for (const area of areas.values()) {
    for (const event of area.events)
      for (const tier of event.rewardByScore)
        for (const monsterId of tier.reward.unlockMonsters ?? []) unlockableMonsters.add(monsterId);
    for (const mission of area.missions)
      for (const monsterId of mission.reward.unlockMonsters ?? []) unlockableMonsters.add(monsterId);
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
    unlockableMonsters,
    monstersByArea,
    questionFiles: manifest.questions ?? [],
    questionFilesByGrade: manifest.questionFilesByGrade ?? {},
  };
}

/** 参照整合性チェック。validate-content と実行時の両方で使う */
export function findBrokenReferences(c: ContentIndex): string[] {
  const errs: string[] = [];
  const has = (m: Map<string, unknown>, id: string | undefined) => id === undefined || m.has(id);
  const checkUnique = (ids: Iterable<string>, where: string): Set<string> => {
    const seen = new Set<string>();
    for (const id of ids) {
      if (seen.has(id)) errs.push(`${where} "${id}" が重複しています`);
      seen.add(id);
    }
    return seen;
  };
  const islandIds = new Set<string>();
  const islandOrders = new Set<number>();
  const areaOwners = new Map<string, string[]>();

  checkUnique(c.elements.elements, 'elements: element');
  for (const attack of elementSchema.options) {
    if (!c.elements.elements.includes(attack)) errs.push(`elements: element "${attack}" がありません`);
    const row = c.elements.multipliers[attack];
    if (!row) {
      errs.push(`elements: multipliers."${attack}" がありません`);
      continue;
    }
    for (const defend of elementSchema.options)
      if (row[defend] === undefined) errs.push(`elements: multipliers."${attack}"."${defend}" がありません`);
  }

  for (const island of c.world.islands) {
    if (islandIds.has(island.id)) errs.push(`world: island id "${island.id}" が重複しています`);
    islandIds.add(island.id);
    if (islandOrders.has(island.order)) errs.push(`world: island order ${island.order} が重複しています`);
    islandOrders.add(island.order);
    const ownAreas = new Set<string>();
    for (const a of island.areas)
      if (!c.areas.has(a)) errs.push(`world: island "${island.id}" の area "${a}" が存在しません`);
      else {
        if (ownAreas.has(a)) errs.push(`world: island "${island.id}" の area "${a}" が重複しています`);
        else {
          ownAreas.add(a);
          areaOwners.set(a, [...(areaOwners.get(a) ?? []), island.id]);
        }
      }
    if (island.status === 'playable') {
      const boss = c.monsters.get(island.bossId);
      if (!boss) errs.push(`world: island "${island.id}" の bossId "${island.bossId}" が存在しません`);
      else {
        if (!boss.isBoss)
          errs.push(`world: island "${island.id}" の bossId "${island.bossId}" は isBoss: true が必要です`);
        if (boss.area !== island.id)
          errs.push(
            `world: island "${island.id}" の bossId "${island.bossId}" の area が "${boss.area}" です`,
          );
      }
    }
  }
  for (const [areaId, owners] of areaOwners)
    if (owners.length > 1) errs.push(`world: area "${areaId}" が複数の島にあります: ${owners.join(', ')}`);
  for (const a of c.areas.values()) {
    if (!c.world.islands.some((i) => i.id === a.island))
      errs.push(`area "${a.id}": island "${a.island}" が world にありません`);
    const owners = areaOwners.get(a.id) ?? [];
    if (owners.length === 0) errs.push(`area "${a.id}": world のどの島にも含まれていません`);
    else if (!owners.includes(a.island))
      errs.push(`area "${a.id}": island "${a.island}" の areas に含まれていません`);
    if (!has(c.monsters, a.boss)) errs.push(`area "${a.id}": boss "${a.boss}" が存在しません`);
    if (!has(c.monsters, a.midBoss)) errs.push(`area "${a.id}": midBoss "${a.midBoss}" が存在しません`);
    if (a.boss && c.monsters.has(a.boss) && !c.monsters.get(a.boss)!.isBoss)
      errs.push(`area "${a.id}": boss "${a.boss}" は isBoss: true にしてください`);
    for (const id of [a.boss, a.midBoss, a.secret?.boss]) {
      const boss = id ? c.monsters.get(id) : undefined;
      if (boss && boss.area !== a.id)
        errs.push(`area "${a.id}": boss "${id}" の area が "${boss.area}" です`);
    }
    if (a.secret && !c.monsters.get(a.secret.boss)?.isBoss)
      errs.push(`area "${a.id}": secret.boss "${a.secret.boss}" が無いか、isBoss: true ではありません`);
    else if (a.midBoss && c.monsters.has(a.midBoss) && !c.monsters.get(a.midBoss)!.isBoss)
      errs.push(
        `area "${a.id}": midBoss "${a.midBoss}" は isBoss: true にしてください（にげられない戦いにする）`,
      );
    checkUnique(
      [a.boss, a.midBoss, a.secret?.boss, ...a.regions.map((region) => region.boss?.monsterId)].filter(
        (id): id is string => !!id,
      ),
      `area "${a.id}": boss monster`,
    );
    const motifIds = checkUnique(
      a.motifs.map((motif) => motif.id),
      `area "${a.id}": motif id`,
    );
    for (const motif of a.motifs) {
      if (motif.kind !== 'food' && motif.kind !== 'craft') continue;
      const itemId = `${a.id}-${motif.id}`;
      const item = c.items.get(itemId);
      const expectedKind = motif.kind === 'food' ? 'consumable' : 'material';
      if (!item) errs.push(`area "${a.id}": specialty "${motif.id}" の item "${itemId}" が存在しません`);
      else {
        if (item.kind !== expectedKind)
          errs.push(
            `area "${a.id}": specialty "${motif.id}" の item.kind が "${item.kind}" です（${expectedKind} が必要）`,
          );
        if (motif.kind === 'food' && !item.use?.heal)
          errs.push(`area "${a.id}": food specialty "${motif.id}" には HP 回復効果が必要です`);
        if (item.areaOrigin !== a.id)
          errs.push(
            `area "${a.id}": specialty "${motif.id}" の item.areaOrigin が "${item.areaOrigin}" です`,
          );
      }
    }
    checkUnique(
      a.events.map((event) => event.id),
      `area "${a.id}": event id`,
    );
    checkUnique(
      a.missions.map((mission) => mission.id),
      `area "${a.id}": mission id`,
    );
    checkUnique(
      (a.town?.npcs ?? []).map((npc) => npc.id),
      `area "${a.id}": npc id`,
    );
    checkUnique(
      a.encounters.map((encounter) => `${encounter.region ?? '*'}:${encounter.zone}`),
      `area "${a.id}": encounter key`,
    );
    checkUnique(
      a.shop.map((entry) => entry.itemId),
      `area "${a.id}": shop itemId`,
    );
    const regionIds = new Set<string>();
    const regionMotifIds = new Set<string>();
    for (const region of a.regions) {
      if (regionIds.has(region.id)) errs.push(`area "${a.id}": region "${region.id}" が重複しています`);
      regionIds.add(region.id);
      for (const motifId of region.motifs) {
        if (regionMotifIds.has(motifId))
          errs.push(`area "${a.id}": region motif "${motifId}" が重複しています`);
        regionMotifIds.add(motifId);
        if (!motifIds.has(motifId))
          errs.push(`area "${a.id}": region "${region.id}" の motif "${motifId}" が存在しません`);
      }
      if (region.boss) {
        const boss = c.monsters.get(region.boss.monsterId);
        if (!boss)
          errs.push(
            `area "${a.id}": region "${region.id}" の boss "${region.boss.monsterId}" が存在しません`,
          );
        else if (boss.area !== a.id)
          errs.push(
            `area "${a.id}": region "${region.id}" の boss "${region.boss.monsterId}" の area が "${boss.area}" です`,
          );
      }
    }
    if (a.regions.length && a.regions.filter((region) => region.start).length !== 1)
      errs.push(`area "${a.id}": regions の start はちょうど1つ必要です`);
    if (a.regions.length)
      for (const motifId of motifIds)
        if (!regionMotifIds.has(motifId))
          errs.push(`area "${a.id}": motif "${motifId}" がどの region にもありません`);
    checkUnique(
      a.regionGates.map((gate) => [...gate.between].sort().join(':')),
      `area "${a.id}": regionGate pair`,
    );
    for (const gate of a.regionGates) {
      for (const regionId of gate.between)
        if (!regionIds.has(regionId))
          errs.push(`area "${a.id}": regionGate の region "${regionId}" が存在しません`);
      if (gate.between[0] === gate.between[1])
        errs.push(`area "${a.id}": regionGate が同じ region "${gate.between[0]}" を結んでいます`);
      const opener = a.regions.find((region) => region.id === gate.openedBy);
      if (!opener) errs.push(`area "${a.id}": regionGate の openedBy "${gate.openedBy}" が存在しません`);
      else if (!opener.boss)
        errs.push(`area "${a.id}": regionGate の openedBy "${gate.openedBy}" に boss がいません`);
    }
    if (a.regions.length) {
      const reachable = new Set(a.regions.filter((region) => region.start).map((region) => region.id));
      let changed = true;
      while (changed) {
        changed = false;
        for (const gate of a.regionGates) {
          if (!reachable.has(gate.openedBy)) continue;
          for (const regionId of gate.between)
            if (!reachable.has(regionId) && regionIds.has(regionId)) {
              reachable.add(regionId);
              changed = true;
            }
        }
      }
      for (const region of a.regions)
        if (!reachable.has(region.id)) errs.push(`area "${a.id}": region "${region.id}" に到達できません`);
    }
    for (const e of a.encounters) {
      if (e.region && !regionIds.has(e.region))
        errs.push(`area "${a.id}": encounter の region "${e.region}" が存在しません`);
      checkUnique(
        e.table.map((entry) => entry.monsterId),
        `area "${a.id}": encounter "${e.region ?? '*'}:${e.zone}" monster`,
      );
      for (const t of e.table)
        if (!c.monsters.has(t.monsterId))
          errs.push(`area "${a.id}": encounter "${t.monsterId}" が存在しません`);
    }
    for (const s of a.shop) {
      const item = c.items.get(s.itemId);
      if (!item) errs.push(`area "${a.id}": shop "${s.itemId}" が存在しません`);
      else if (item.price === undefined)
        errs.push(`area "${a.id}": shop "${s.itemId}" に item.price がありません`);
      else if (item.price !== s.price)
        errs.push(
          `area "${a.id}": shop "${s.itemId}" の price ${s.price} が item.price ${item.price} と一致しません`,
        );
    }
    for (const ev of a.events) {
      if (!motifIds.has(ev.motifId))
        errs.push(
          `area "${a.id}": event "${ev.id}" の motifId "${ev.motifId}" がこの県の motifs にありません`,
        );
      checkUnique(
        ev.rewardByScore.map((tier) => String(tier.min)),
        `area "${a.id}": event "${ev.id}" reward min`,
      );
      if (!ev.rewardByScore.some((tier) => tier.min === 0))
        errs.push(`area "${a.id}": event "${ev.id}" の rewardByScore に min: 0 がありません`);
      for (const r of ev.rewardByScore)
        errs.push(...checkRewardReferences(r.reward, c, `area "${a.id}" event "${ev.id}"`));
    }
    const npcIds = new Set((a.town?.npcs ?? []).map((n) => n.id));
    for (const ms of a.missions) {
      if (!npcIds.has(ms.giverNpc))
        errs.push(
          `area "${a.id}": mission "${ms.id}" の giverNpc "${ms.giverNpc}" が town.npcs にありません`,
        );
      errs.push(...checkRewardReferences(ms.reward, c, `area "${a.id}" mission "${ms.id}"`));
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
    checkUnique(m.skills, `monster "${m.id}": skill`);
    for (const s of m.skills)
      if (!c.skills.has(s)) errs.push(`monster "${m.id}": skill "${s}" が存在しません`);
    checkUnique(
      m.drops.map((drop) => drop.itemId),
      `monster "${m.id}": drop`,
    );
    for (const d of m.drops)
      if (!c.items.has(d.itemId)) errs.push(`monster "${m.id}": drop "${d.itemId}" が存在しません`);
    if (!has(c.items, m.recruitItem))
      errs.push(`monster "${m.id}": recruitItem "${m.recruitItem}" が存在しません`);
    const phases = m.bossPhases ?? [];
    if (phases.length && !m.isBoss)
      errs.push(`monster "${m.id}": bossPhases を使うには isBoss: true が必要です`);
    for (const [index, p] of phases.entries()) {
      if (index > 0 && p.hpBelow >= phases[index - 1]!.hpBelow)
        errs.push(`monster "${m.id}": bossPhases の hpBelow は大きい順にしてください`);
      checkUnique(p.skills ?? [], `monster "${m.id}": bossPhase ${index} skill`);
      for (const s of p.skills ?? [])
        if (!c.skills.has(s)) errs.push(`monster "${m.id}": phase skill "${s}" が存在しません`);
    }
    if (m.evolution) {
      const target = c.monsters.get(m.evolution.to);
      if (!target) errs.push(`monster "${m.id}": evolution.to "${m.evolution.to}" が存在しません`);
      else {
        if (target.area !== m.area)
          errs.push(`monster "${m.id}": evolution.to "${target.id}" の area が "${target.area}" です`);
        if (target.motifId !== m.motifId)
          errs.push(`monster "${m.id}": evolution.to "${target.id}" の motifId が "${target.motifId}" です`);
      }
    }
    if (m.evolution && !c.items.has(m.evolution.item))
      errs.push(`monster "${m.id}": evolution.item "${m.evolution.item}" が存在しません`);
  }
  const checkedEvolutions = new Set<string>();
  for (const start of c.monsters.keys()) {
    if (checkedEvolutions.has(start)) continue;
    const path: string[] = [];
    const positions = new Map<string, number>();
    let current = start;
    while (true) {
      const cycleStart = positions.get(current);
      if (cycleStart !== undefined) {
        const cycle = [...path.slice(cycleStart), current];
        errs.push(`monster evolution: ${cycle.join(' -> ')} の循環があります`);
        break;
      }
      if (checkedEvolutions.has(current)) break;
      positions.set(current, path.length);
      path.push(current);
      const next = c.monsters.get(current)?.evolution?.to;
      if (!next || !c.monsters.has(next)) break;
      current = next;
    }
    for (const id of path) checkedEvolutions.add(id);
  }
  for (const it of c.items.values()) {
    const equipment = equipKinds.includes(it.kind as (typeof equipKinds)[number]);
    if (it.kind === 'consumable' && !it.use) errs.push(`item "${it.id}": consumable には use が必要です`);
    if (it.kind !== 'consumable' && it.use)
      errs.push(`item "${it.id}": use を設定できるのは consumable だけです`);
    for (const [field, value] of Object.entries({
      stats: it.stats,
      element: it.element,
      grantsSkill: it.grantsSkill,
      setId: it.setId,
    }))
      if (!equipment && value !== undefined)
        errs.push(`item "${it.id}": ${field} を設定できるのは装備だけです`);
    if (!has(c.skills, it.grantsSkill))
      errs.push(`item "${it.id}": grantsSkill "${it.grantsSkill}" が存在しません`);
    if (!has(c.sets, it.setId)) errs.push(`item "${it.id}": setId "${it.setId}" が存在しません`);
    else if (it.setId && !c.sets.get(it.setId)!.pieces.includes(it.id))
      errs.push(`item "${it.id}": set "${it.setId}" の pieces にありません`);
    if (!has(c.areas, it.areaOrigin))
      errs.push(`item "${it.id}": areaOrigin "${it.areaOrigin}" が存在しません`);
  }
  for (const s of c.sets.values()) {
    checkUnique(s.pieces, `set "${s.id}": piece`);
    const kinds: string[] = [];
    for (const p of s.pieces) {
      const item = c.items.get(p);
      if (!item) errs.push(`set "${s.id}": piece "${p}" が存在しません`);
      else {
        kinds.push(item.kind);
        if (!equipKinds.includes(item.kind as (typeof equipKinds)[number]))
          errs.push(`set "${s.id}": piece "${p}" の kind "${item.kind}" は装備ではありません`);
        if (item.setId !== s.id) errs.push(`set "${s.id}": piece "${p}" の setId が "${item.setId}" です`);
      }
    }
    checkUnique(kinds, `set "${s.id}": kind`);
    for (const kind of equipKinds)
      if (!kinds.includes(kind)) errs.push(`set "${s.id}": kind "${kind}" がありません`);
  }
  for (const r of c.recipes.values()) {
    const result = c.items.get(r.result.itemId);
    if (!result) errs.push(`recipe "${r.id}": result "${r.result.itemId}" が存在しません`);
    else if (!equipKinds.includes(result.kind as (typeof equipKinds)[number]))
      errs.push(`recipe "${r.id}": result "${r.result.itemId}" は装備ではありません`);
    for (const m of r.materials) {
      if (!c.items.has(m.itemId)) errs.push(`recipe "${r.id}": material "${m.itemId}" が存在しません`);
      if (m.itemId === r.result.itemId)
        errs.push(`recipe "${r.id}": result "${r.result.itemId}" を材料にはできません`);
    }
  }
  for (const unit of c.units.values()) {
    const [idSubject, idGrade] = unit.id.split('.');
    if (idSubject !== unit.subject)
      errs.push(`unit "${unit.id}": id の教科 ${idSubject} と subject ${unit.subject} が一致しません`);
    const grade = Number(idGrade?.slice(1));
    if (grade !== unit.grade)
      errs.push(`unit "${unit.id}": id の学年 ${grade} と grade ${unit.grade} が一致しません`);
  }
  for (const sk of c.skills.values()) {
    checkUnique(sk.unitHint ?? [], `skill "${sk.id}": unitHint`);
    for (const u of sk.unitHint ?? []) {
      const unit = c.units.get(u);
      if (!unit) errs.push(`skill "${sk.id}": unitHint "${u}" が units.json にありません`);
      else {
        if (unit.subject !== sk.subject)
          errs.push(`skill "${sk.id}": unitHint "${u}" の教科が ${unit.subject} です`);
        if (unit.grade < sk.gradeRange[0] || unit.grade > sk.gradeRange[1])
          errs.push(`skill "${sk.id}": unitHint "${u}" の学年 ${unit.grade} が gradeRange 外です`);
      }
    }
    if (sk.costGauge > c.settings.subjectGauge.max)
      errs.push(
        `skill "${sk.id}": costGauge ${sk.costGauge} が 教科ゲージの 上限 ${c.settings.subjectGauge.max} を こえています`,
      );
  }
  const gradeKeys = new Set(['1', '2', '3', '4', '5', '6']);
  for (const grade of gradeKeys)
    if (c.settings.timeLimitSecByGrade[grade] === undefined)
      errs.push(`settings.timeLimitSecByGrade."${grade}" がありません`);
  for (const grade of Object.keys(c.settings.timeLimitSecByGrade))
    if (!gradeKeys.has(grade)) errs.push(`settings.timeLimitSecByGrade."${grade}" は対象外です`);
  if (c.settings.combo.critBase > c.settings.combo.critMax)
    errs.push('settings.combo.critBase は critMax 以下にしてください');
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
    for (const [slot, id] of Object.entries(rv.equipment)) {
      if (!id) continue;
      const item = c.items.get(id);
      if (!item) errs.push(`rival "${rv.id}": equipment "${id}" が存在しません`);
      else if (item.kind !== slot)
        errs.push(`rival "${rv.id}": equipment.${slot} "${id}" の kind が "${item.kind}" です`);
    }
  }
  return errs;
}
