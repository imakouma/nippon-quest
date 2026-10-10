import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  bundledFetchReader,
  findBrokenReferences,
  loadContent,
  type FileReader,
} from '../../src/core/content/loader';
import {
  itemSchema,
  missionConditionSchema,
  monsterSchema,
  recipeSchema,
  rewardSchema,
  settingsSchema,
  shopEntrySchema,
  xpTableSchema,
} from '../../src/core/content/schemas';

const CONTENT = fileURLToPath(new URL('../../content/', import.meta.url));
const read: FileReader = async (rel) => JSON.parse(readFileSync(CONTENT + rel, 'utf8'));

afterEach(() => vi.unstubAllGlobals());

describe('content loader', () => {
  it('47都道府県と10島を読み込める', async () => {
    const c = await loadContent(read);
    expect(c.areas.size).toBe(47);
    expect(c.world.islands).toHaveLength(10);
    expect(c.world.islands.reduce((n, i) => n + i.areas.length, 0)).toBe(47);
  });

  it('属性一覧と相性表が全属性の組み合わせを含む', async () => {
    const c = await loadContent(read);
    const elements = structuredClone(c.elements);
    elements.elements = elements.elements.filter((element) => element !== 'none');
    elements.elements.push('hino');
    delete elements.multipliers.hino!.mizu;

    const errors = findBrokenReferences({ ...c, elements });
    expect(errors).toContain('elements: element "hino" が重複しています');
    expect(errors).toContain('elements: element "none" がありません');
    expect(errors).toContain('elements: multipliers."hino"."mizu" がありません');
  });

  it('全学年の制限時間と矛盾しない会心率設定を検証する', async () => {
    const c = await loadContent(read);
    const settings = structuredClone(c.settings);
    delete settings.timeLimitSecByGrade['3'];
    settings.timeLimitSecByGrade['7'] = 10;
    settings.combo.critBase = settings.combo.critMax + 0.1;

    const errors = findBrokenReferences({ ...c, settings });
    expect(errors).toContain('settings.timeLimitSecByGrade."3" がありません');
    expect(errors).toContain('settings.timeLimitSecByGrade."7" は対象外です');
    expect(errors).toContain('settings.combo.critBase は critMax 以下にしてください');
  });

  it('参照切れがない', async () => {
    const c = await loadContent(read);
    expect(findBrokenReferences(c)).toEqual([]);
  });

  it('県の複数所属・所属漏れと、島ID・順番の重複を検出する', async () => {
    const c = await loadContent(read);
    const world = structuredClone(c.world);
    const tohoku = world.islands.find((island) => island.id === 'tohoku')!;
    const hokkaido = world.islands.find((island) => island.id === 'hokkaido')!;
    hokkaido.areas.push('aomori');
    tohoku.areas = tohoku.areas.filter((areaId) => areaId !== 'iwate');
    tohoku.areas = tohoku.areas.filter((areaId) => areaId !== 'miyagi');
    hokkaido.areas.push('miyagi');
    world.islands.push({ ...structuredClone(hokkaido), areas: ['hokkaido'] });

    const errors = findBrokenReferences({ ...c, world });
    expect(errors).toContain('world: area "aomori" が複数の島にあります: tohoku, hokkaido');
    expect(errors).toContain('area "iwate": world のどの島にも含まれていません');
    expect(errors).toContain('area "miyagi": island "tohoku" の areas に含まれていません');
    expect(errors).toContain('world: island id "hokkaido" が重複しています');
    expect(errors).toContain(`world: island order ${hokkaido.order} が重複しています`);
  });

  it('ボス種別・所属と名所エリアの参照切れを検出する', async () => {
    const c = await loadContent(read);
    const monsters = new Map(c.monsters);
    const islandBoss = c.world.islands.find((island) => island.id === 'tohoku')!.bossId;
    monsters.set(islandBoss, { ...monsters.get(islandBoss)!, isBoss: false, area: 'aomori' });

    const areas = new Map(c.areas);
    const aomori = structuredClone(areas.get('aomori')!);
    monsters.set(aomori.boss!, { ...monsters.get(aomori.boss!)!, area: 'iwate' });
    aomori.midBoss = 'missing-midboss';
    aomori.regions.forEach((region) => (region.start = false));
    aomori.regions[0]!.motifs.push('missing-motif');
    aomori.regions[0]!.boss!.monsterId = 'missing-region-boss';
    aomori.regionGates.push({ between: ['missing-region', 'missing-region'], openedBy: 'missing-region' });
    aomori.encounters[0]!.region = 'missing-region';
    areas.set(aomori.id, aomori);

    const errors = findBrokenReferences({ ...c, areas, monsters });
    expect(errors).toContain(`world: island "tohoku" の bossId "${islandBoss}" は isBoss: true が必要です`);
    expect(errors).toContain(`world: island "tohoku" の bossId "${islandBoss}" の area が "aomori" です`);
    expect(errors).toContain(`area "aomori": boss "${aomori.boss}" の area が "iwate" です`);
    expect(errors).toContain('area "aomori": midBoss "missing-midboss" が存在しません');
    expect(errors).toContain('area "aomori": regions の start はちょうど1つ必要です');
    expect(errors).toContain('area "aomori": region "nebuta" の motif "missing-motif" が存在しません');
    expect(errors).toContain('area "aomori": region "nebuta" の boss "missing-region-boss" が存在しません');
    expect(errors).toContain('area "aomori": regionGate の openedBy "missing-region" が存在しません');
    expect(errors).toContain('area "aomori": encounter の region "missing-region" が存在しません');
  });

  it('逆順を含む地域ゲートの重複を検出する', async () => {
    const c = await loadContent(read);
    const areas = new Map(c.areas);
    const aomori = structuredClone(areas.get('aomori')!);
    const gate = aomori.regionGates[0]!;
    aomori.regionGates.push({ ...structuredClone(gate), between: [gate.between[1], gate.between[0]] });
    areas.set(aomori.id, aomori);

    expect(findBrokenReferences({ ...c, areas })).toContain(
      `area "aomori": regionGate pair "${[...gate.between].sort().join(':')}" が重複しています`,
    );
  });

  it('開始地域から開放できない地域を検出する', async () => {
    const c = await loadContent(read);
    const areas = new Map(c.areas);
    const aomori = structuredClone(areas.get('aomori')!);
    const locked = aomori.regions.find((region) => !region.start)!;
    for (const gate of aomori.regionGates) gate.openedBy = locked.id;
    areas.set(aomori.id, aomori);

    expect(findBrokenReferences({ ...c, areas })).toContain(
      `area "aomori": region "${locked.id}" に到達できません`,
    );
  });

  it('地域間の名所重複と未所属名所を検出する', async () => {
    const c = await loadContent(read);
    const areas = new Map(c.areas);
    const aomori = structuredClone(areas.get('aomori')!);
    const duplicate = aomori.regions[0]!.motifs[0]!;
    aomori.regions[1]!.motifs.push(duplicate);
    const missing = aomori.motifs.at(-1)!.id;
    for (const region of aomori.regions) region.motifs = region.motifs.filter((id) => id !== missing);
    areas.set(aomori.id, aomori);

    const errors = findBrokenReferences({ ...c, areas });
    expect(errors).toContain(`area "aomori": region motif "${duplicate}" が重複しています`);
    expect(errors).toContain(`area "aomori": motif "${missing}" がどの region にもありません`);
  });

  it('県内のボス役割に同じモンスターを使い回さない', async () => {
    const c = await loadContent(read);
    const areas = new Map(c.areas);
    const aomori = structuredClone(areas.get('aomori')!);
    aomori.secret!.boss = aomori.boss!;
    areas.set(aomori.id, aomori);

    expect(findBrokenReferences({ ...c, areas })).toContain(
      `area "aomori": boss monster "${aomori.boss}" が重複しています`,
    );
  });

  it('モンスターの循環進化を検出する', async () => {
    const c = await loadContent(read);
    const monsters = new Map(c.monsters);
    const [first, second] = [...monsters.values()].slice(0, 2).map((monster) => structuredClone(monster));
    const itemId = c.items.keys().next().value!;
    first!.evolution = { to: second!.id, item: itemId };
    second!.evolution = { to: first!.id, item: itemId };
    monsters.set(first!.id, first!);
    monsters.set(second!.id, second!);

    expect(findBrokenReferences({ ...c, monsters })).toContain(
      `monster evolution: ${first!.id} -> ${second!.id} -> ${first!.id} の循環があります`,
    );
  });

  it('進化先は同じ県・同じ名所モチーフに属する', async () => {
    const c = await loadContent(read);
    const monsters = new Map(c.monsters);
    const source = structuredClone([...monsters.values()].find((monster) => monster.evolution)!);
    const target = [...monsters.values()].find((monster) => monster.area !== source.area)!;
    source.evolution!.to = target.id;
    monsters.set(source.id, source);

    const errors = findBrokenReferences({ ...c, monsters });
    expect(errors).toContain(
      `monster "${source.id}": evolution.to "${target.id}" の area が "${target.area}" です`,
    );
    expect(errors).toContain(
      `monster "${source.id}": evolution.to "${target.id}" の motifId が "${target.motifId}" です`,
    );
  });

  it('モンスターの技重複を検出する', async () => {
    const c = await loadContent(read);
    const monsters = new Map(c.monsters);
    const monster = structuredClone([...monsters.values()].find((entry) => entry.skills.length > 0)!);
    monster.skills.push(monster.skills[0]!);
    monsters.set(monster.id, monster);

    expect(findBrokenReferences({ ...c, monsters })).toContain(
      `monster "${monster.id}": skill "${monster.skills[0]}" が重複しています`,
    );
  });

  it('モンスターの同一ドロップ重複を検出する', async () => {
    const c = await loadContent(read);
    const monsters = new Map(c.monsters);
    const monster = structuredClone([...monsters.values()].find((entry) => entry.drops.length > 0)!);
    monster.drops.push(structuredClone(monster.drops[0]!));
    monsters.set(monster.id, monster);

    expect(findBrokenReferences({ ...c, monsters })).toContain(
      `monster "${monster.id}": drop "${monster.drops[0]!.itemId}" が重複しています`,
    );
  });

  it('ボスフェーズの対象・順序・技重複を検証する', async () => {
    const c = await loadContent(read);
    const monsters = new Map(c.monsters);
    const monster = structuredClone(
      [...monsters.values()].find((entry) => (entry.bossPhases?.length ?? 0) >= 2)!,
    );
    monster.isBoss = false;
    monster.bossPhases![1]!.hpBelow = monster.bossPhases![0]!.hpBelow;
    const skill = monster.bossPhases![0]!.skills![0]!;
    monster.bossPhases![0]!.skills!.push(skill);
    monsters.set(monster.id, monster);

    const errors = findBrokenReferences({ ...c, monsters });
    expect(errors).toContain(`monster "${monster.id}": bossPhases を使うには isBoss: true が必要です`);
    expect(errors).toContain(`monster "${monster.id}": bossPhases の hpBelow は大きい順にしてください`);
    expect(errors).toContain(`monster "${monster.id}": bossPhase 0 skill "${skill}" が重複しています`);
  });

  it('装備セットの部位重複を検出する', async () => {
    const c = await loadContent(read);
    const sets = new Map(c.sets);
    const set = structuredClone(sets.values().next().value!);
    set.pieces.push(set.pieces[0]!);
    sets.set(set.id, set);

    expect(findBrokenReferences({ ...c, sets })).toContain(
      `set "${set.id}": piece "${set.pieces[0]}" が重複しています`,
    );
  });

  it('消耗品分類と使用効果の食い違いを検出する', async () => {
    const c = await loadContent(read);
    const items = new Map(c.items);
    const consumable = structuredClone([...items.values()].find((item) => item.kind === 'consumable')!);
    const equipment = structuredClone([...items.values()].find((item) => item.kind === 'weapon')!);
    const use = consumable.use!;
    delete consumable.use;
    equipment.use = use;
    consumable.stats = { scienceAtk: 1 };
    consumable.element = 'hino';
    consumable.grantsSkill = c.skills.keys().next().value!;
    consumable.setId = c.sets.keys().next().value!;
    items.set(consumable.id, consumable);
    items.set(equipment.id, equipment);

    const errors = findBrokenReferences({ ...c, items });
    expect(errors).toContain(`item "${consumable.id}": consumable には use が必要です`);
    expect(errors).toContain(`item "${equipment.id}": use を設定できるのは consumable だけです`);
    for (const field of ['stats', 'element', 'grantsSkill', 'setId'])
      expect(errors).toContain(`item "${consumable.id}": ${field} を設定できるのは装備だけです`);
  });

  it('クラフト完成品は装備で、自分自身を材料にしない', async () => {
    const c = await loadContent(read);
    const recipes = new Map(c.recipes);
    const recipe = structuredClone(recipes.values().next().value!);
    recipe.result.itemId = recipe.materials[0]!.itemId;
    recipes.set(recipe.id, recipe);

    const errors = findBrokenReferences({ ...c, recipes });
    expect(errors).toContain(`recipe "${recipe.id}": result "${recipe.result.itemId}" は装備ではありません`);
    expect(errors).toContain(`recipe "${recipe.id}": result "${recipe.result.itemId}" を材料にはできません`);
  });

  it('装備セットとアイテムの setId の食い違いを検出する', async () => {
    const c = await loadContent(read);
    const sets = new Map(c.sets);
    const items = new Map(c.items);
    const set = structuredClone(sets.values().next().value!);
    const listedItem = structuredClone(items.get(set.pieces[0]!)!);
    const unlistedItem = structuredClone(
      [...items.values()].find((item) => item.kind === listedItem.kind && !set.pieces.includes(item.id))!,
    );
    delete listedItem.setId;
    unlistedItem.setId = set.id;
    items.set(listedItem.id, listedItem);
    items.set(unlistedItem.id, unlistedItem);

    const errors = findBrokenReferences({ ...c, sets, items });
    expect(errors).toContain(
      `set "${set.id}": piece "${listedItem.id}" の setId が "${listedItem.setId}" です`,
    );
    expect(errors).toContain(`item "${unlistedItem.id}": set "${set.id}" の pieces にありません`);
  });

  it('装備セットに武器・頭・胴・脚・足が各1つあることを検証する', async () => {
    const c = await loadContent(read);
    const sets = new Map(c.sets);
    const items = new Map(c.items);
    const set = structuredClone(sets.values().next().value!);
    const weapon = structuredClone(
      [...items.values()].find((item) => item.kind === 'weapon' && !set.pieces.includes(item.id))!,
    );
    weapon.setId = set.id;
    items.set(weapon.id, weapon);
    set.pieces[4] = weapon.id;
    sets.set(set.id, set);

    const errors = findBrokenReferences({ ...c, sets, items });
    expect(errors).toContain(`set "${set.id}": kind "weapon" が重複しています`);
    expect(errors).toContain(`set "${set.id}": kind "feet" がありません`);
  });

  it('ライバルの装備スロットとアイテム種別の食い違いを検出する', async () => {
    const c = await loadContent(read);
    const rivals = new Map(c.rivals);
    const rival = structuredClone(rivals.values().next().value!);
    const armor = [...c.items.values()].find((item) => item.kind === 'chest')!;
    rival.equipment.weapon = armor.id;
    rivals.set(rival.id, rival);

    expect(findBrokenReferences({ ...c, rivals })).toContain(
      `rival "${rival.id}": equipment.weapon "${armor.id}" の kind が "chest" です`,
    );
  });

  it('県内の名所・イベント・依頼・NPC・出現表・商品並びの重複を検出する', async () => {
    const c = await loadContent(read);
    const areas = new Map(c.areas);
    const aomori = structuredClone(areas.get('aomori')!);
    aomori.motifs.push(structuredClone(aomori.motifs[0]!));
    aomori.events.push(structuredClone(aomori.events[0]!));
    aomori.missions.push(structuredClone(aomori.missions[0]!));
    aomori.town!.npcs.push(structuredClone(aomori.town!.npcs[0]!));
    aomori.encounters.push(structuredClone(aomori.encounters[0]!));
    aomori.encounters[0]!.table.push(structuredClone(aomori.encounters[0]!.table[0]!));
    aomori.shop.push(structuredClone(aomori.shop[0]!));
    areas.set(aomori.id, aomori);

    const errors = findBrokenReferences({ ...c, areas });
    expect(errors).toContain(`area "aomori": motif id "${aomori.motifs[0]!.id}" が重複しています`);
    expect(errors).toContain(`area "aomori": event id "${aomori.events[0]!.id}" が重複しています`);
    expect(errors).toContain(`area "aomori": mission id "${aomori.missions[0]!.id}" が重複しています`);
    expect(errors).toContain(`area "aomori": npc id "${aomori.town!.npcs[0]!.id}" が重複しています`);
    const encounter = aomori.encounters[0]!;
    expect(errors).toContain(
      `area "aomori": encounter key "${encounter.region ?? '*'}:${encounter.zone}" が重複しています`,
    );
    expect(errors).toContain(
      `area "aomori": encounter "${encounter.region ?? '*'}:${encounter.zone}" monster "${encounter.table[0]!.monsterId}" が重複しています`,
    );
    expect(errors).toContain(`area "aomori": shop itemId "${aomori.shop[0]!.itemId}" が重複しています`);
  });

  it('食・工芸の特産品に対応するアイテム種別と産地を検証する', async () => {
    const c = await loadContent(read);
    const items = new Map(c.items);
    const aomori = c.areas.get('aomori')!;
    const food = aomori.motifs.find((motif) => motif.kind === 'food')!;
    const craftMotif = aomori.motifs.find((motif) => motif.kind === 'craft')!;
    const foodId = `aomori-${food.id}`;
    const craftId = `aomori-${craftMotif.id}`;
    const foodItem = structuredClone(items.get(foodId)!);
    foodItem.kind = 'material';
    foodItem.use = { mp: 1 };
    foodItem.areaOrigin = 'iwate';
    items.set(foodId, foodItem);
    items.delete(craftId);

    const errors = findBrokenReferences({ ...c, items });
    expect(errors).toContain(
      `area "aomori": specialty "${food.id}" の item.kind が "material" です（consumable が必要）`,
    );
    expect(errors).toContain(`area "aomori": food specialty "${food.id}" には HP 回復効果が必要です`);
    expect(errors).toContain(`area "aomori": specialty "${food.id}" の item.areaOrigin が "iwate" です`);
    expect(errors).toContain(
      `area "aomori": specialty "${craftMotif.id}" の item "${craftId}" が存在しません`,
    );
  });

  it('ショップ価格とアイテムの基準価格の食い違いを検出する', async () => {
    const c = await loadContent(read);
    const areas = new Map(c.areas);
    const aomori = structuredClone(areas.get('aomori')!);
    const entry = aomori.shop[0]!;
    const item = c.items.get(entry.itemId)!;
    entry.price = item.price! + 1;
    areas.set(aomori.id, aomori);

    expect(findBrokenReferences({ ...c, areas })).toContain(
      `area "aomori": shop "${entry.itemId}" の price ${entry.price} が item.price ${item.price} と一致しません`,
    );
  });

  it('イベント報酬段階の最低点重複と0点報酬の欠落を検出する', async () => {
    const c = await loadContent(read);
    const areas = new Map(c.areas);
    const aomori = structuredClone(areas.get('aomori')!);
    const event = aomori.events.find((entry) => entry.rewardByScore.length >= 2)!;
    event.rewardByScore = event.rewardByScore.filter((tier) => tier.min !== 0);
    event.rewardByScore[1]!.min = event.rewardByScore[0]!.min;
    areas.set(aomori.id, aomori);

    const errors = findBrokenReferences({ ...c, areas });
    expect(errors).toContain(
      `area "aomori": event "${event.id}" reward min "${event.rewardByScore[0]!.min}" が重複しています`,
    );
    expect(errors).toContain(`area "aomori": event "${event.id}" の rewardByScore に min: 0 がありません`);
  });

  it('同じ報酬内の参照重複を検出する', async () => {
    const c = await loadContent(read);
    const areas = new Map(c.areas);
    const aomori = structuredClone(areas.get('aomori')!);
    const event = aomori.events.find((entry) =>
      entry.rewardByScore.some((tier) => (tier.reward.items?.length ?? 0) > 0),
    )!;
    const tier = event.rewardByScore.find((entry) => (entry.reward.items?.length ?? 0) > 0)!;
    const item = structuredClone(tier.reward.items![0]!);
    tier.reward.items!.push(item);
    areas.set(aomori.id, aomori);

    expect(findBrokenReferences({ ...c, areas })).toContain(
      `area "aomori" event "${event.id}": reward item "${item.itemId}" が重複しています`,
    );
  });

  it('技の単元ヒント重複と教科・学年の食い違いを検出する', async () => {
    const c = await loadContent(read);
    const skills = new Map(c.skills);
    const skill = structuredClone(
      [...skills.values()].find((entry) =>
        [...c.units.values()].some(
          (unit) =>
            unit.subject === entry.subject &&
            (unit.grade < entry.gradeRange[0] || unit.grade > entry.gradeRange[1]),
        ),
      )!,
    );
    const wrongSubject = [...c.units.values()].find((unit) => unit.subject !== skill.subject)!;
    const wrongGrade = [...c.units.values()].find(
      (unit) =>
        unit.subject === skill.subject &&
        (unit.grade < skill.gradeRange[0] || unit.grade > skill.gradeRange[1]),
    )!;
    skill.unitHint = [wrongSubject.id, wrongSubject.id, wrongGrade.id];
    skills.set(skill.id, skill);

    const errors = findBrokenReferences({ ...c, skills });
    expect(errors).toContain(`skill "${skill.id}": unitHint "${wrongSubject.id}" が重複しています`);
    expect(errors).toContain(
      `skill "${skill.id}": unitHint "${wrongSubject.id}" の教科が ${wrongSubject.subject} です`,
    );
    expect(errors).toContain(
      `skill "${skill.id}": unitHint "${wrongGrade.id}" の学年 ${wrongGrade.grade} が gradeRange 外です`,
    );
  });

  it('単元IDの教科・学年とデータ本体の食い違いを検出する', async () => {
    const c = await loadContent(read);
    const units = new Map(c.units);
    const unit = structuredClone(units.values().next().value!);
    const [idSubject, idGrade] = unit.id.split('.');
    unit.subject = unit.subject === 'kokugo' ? 'sansu' : 'kokugo';
    unit.grade = unit.grade === 6 ? 5 : 6;
    units.set(unit.id, unit);

    const errors = findBrokenReferences({ ...c, units });
    expect(errors).toContain(
      `unit "${unit.id}": id の教科 ${idSubject} と subject ${unit.subject} が一致しません`,
    );
    expect(errors).toContain(
      `unit "${unit.id}": id の学年 ${Number(idGrade!.slice(1))} と grade ${unit.grade} が一致しません`,
    );
  });

  it('青森は playable で、ボス・イベント・NPCが揃っている', async () => {
    const c = await loadContent(read);
    const aomori = c.areas.get('aomori')!;
    expect(aomori.status).toBe('playable');
    expect(aomori.boss).toBe('aomori-boss-tsugaru-no-nushi');
    expect(aomori.events.length).toBeGreaterThanOrEqual(4);
    expect(aomori.town?.npcs.length).toBeGreaterThanOrEqual(5);
  });

  it('恐山イベント後は成績にかかわらずイタコドリが出現する', async () => {
    const c = await loadContent(read);
    const event = c.areas.get('aomori')!.events.find((entry) => entry.id === 'aomori-ev-osorezan')!;

    for (const tier of event.rewardByScore)
      expect(tier.reward.unlockMonsters, `score ${tier.min}`).toContain('aomori-itakodori');
  });

  it('47 都道府県 すべて playable で、中ボス・県ボス・裏ステージ・イベント・町の人（お店の人を ふくむ 2 人 以上）が そろっている', async () => {
    const c = await loadContent(read);
    for (const a of c.areas.values()) {
      expect(a.status, a.id).toBe('playable');
      expect(a.midBoss, a.id).toBeDefined();
      expect(a.boss, a.id).toBeDefined();
      expect(a.secret, a.id).toBeDefined();
      expect(a.events.length, a.id).toBeGreaterThanOrEqual(1);
      expect(a.town?.npcs.length ?? 0, a.id).toBeGreaterThanOrEqual(2);
      expect(
        a.town?.npcs.some((n) => n.role === 'shop'),
        a.id,
      ).toBe(true);
    }
  });

  it('イベント報酬は score 0 でも必ずある（GDD §7）', async () => {
    const c = await loadContent(read);
    for (const a of c.areas.values())
      for (const e of a.events) expect(e.rewardByScore.some((r) => r.min === 0)).toBe(true);
  });

  it('報酬・価格・制作個数は安全整数の範囲だけを受け入れる', () => {
    const unsafe = Number.MAX_SAFE_INTEGER + 1;
    expect(rewardSchema.safeParse({ gold: unsafe }).success).toBe(false);
    expect(rewardSchema.safeParse({ xp: unsafe }).success).toBe(false);
    expect(rewardSchema.safeParse({ items: [{ itemId: 'aomori-ringo', n: unsafe }] }).success).toBe(false);
    expect(shopEntrySchema.safeParse({ itemId: 'aomori-ringo', price: unsafe }).success).toBe(false);
    expect(
      recipeSchema.safeParse({
        id: 'unsafe-recipe',
        result: { itemId: 'aomori-ringo', n: unsafe },
        materials: [{ itemId: 'aomori-ringo', n: 1 }],
        gold: 0,
      }).success,
    ).toBe(false);
  });

  it('たのみごとの必要数は 1 以上だけを受け入れる', () => {
    expect(missionConditionSchema.safeParse('defeat:aomori-ringoron:3').success).toBe(true);
    expect(missionConditionSchema.safeParse('collect:aomori-ringo:1').success).toBe(true);
    expect(missionConditionSchema.safeParse('perfect:sansu:10').success).toBe(true);
    expect(missionConditionSchema.safeParse('defeat:aomori-ringoron:0').success).toBe(false);
    expect(missionConditionSchema.safeParse('collect:aomori-ringo:00').success).toBe(false);
    expect(missionConditionSchema.safeParse('perfect:sansu:0').success).toBe(false);
    expect(
      missionConditionSchema.safeParse(`defeat:aomori-ringoron:${Number.MAX_SAFE_INTEGER + 1}`).success,
    ).toBe(false);
  });

  it('回復アイテムは正の回復量を1つ以上必要とする', () => {
    const base = {
      id: 'test-item',
      name: 'テスト',
      kind: 'consumable',
      iconKey: 'test-item',
      blurb: 'テスト',
    };

    expect(itemSchema.safeParse({ ...base, use: { heal: 1 } }).success).toBe(true);
    expect(itemSchema.safeParse({ ...base, use: { mp: 1 } }).success).toBe(true);
    expect(itemSchema.safeParse({ ...base, use: {} }).success).toBe(false);
    expect(itemSchema.safeParse({ ...base, use: { heal: 0 } }).success).toBe(false);
    expect(itemSchema.safeParse({ ...base, use: { mp: -1 } }).success).toBe(false);
  });

  it('累積XP表は0から始まり、レベルごとに必ず増える', () => {
    expect(xpTableSchema.safeParse({ hero: [0, 20, 50], monster: [0, 10, 30] }).success).toBe(true);
    expect(xpTableSchema.safeParse({ hero: [1, 20], monster: [0, 10] }).success).toBe(false);
    expect(xpTableSchema.safeParse({ hero: [0, 20, 20], monster: [0, 10] }).success).toBe(false);
    expect(xpTableSchema.safeParse({ hero: [0, 20], monster: [0, 10, 5] }).success).toBe(false);
  });

  it('成長値は減少せず、問題の好成績ほど攻撃倍率が下がらない', async () => {
    const c = await loadContent(read);
    const monster = structuredClone(c.monsters.values().next().value!);
    monster.growth.base.hp = -1;
    expect(monsterSchema.safeParse(monster).success).toBe(false);

    const settings = structuredClone(c.settings);
    settings.scoreMultipliers.good = settings.scoreMultipliers.perfect + 1;
    expect(settingsSchema.safeParse(settings).success).toBe(false);
  });

  it('名所・特産品の名前と説明は、漢字にすべて ひらがなのルビがある（フィールドや地図では読みを出すため）', async () => {
    const c = await loadContent(read);
    const bare: string[] = [];
    for (const a of c.areas.values())
      for (const m of a.motifs)
        for (const s of [m.name, m.blurb]) {
          const rest = s.replace(/[一-鿿々〆ヶ]+\[[ぁ-ゖー]+\]/g, '');
          if (/[一-鿿々〆ヶ]|[[\]]/.test(rest)) bare.push(`${a.id}.${m.id}: ${s}`);
        }
    expect(bare).toEqual([]);
  });

  it('id 重複を検出する', async () => {
    const dupes: string[] = [];
    const fake: FileReader = async (rel) => {
      if (rel === 'manifest.json') {
        const m = (await read('manifest.json')) as { files: Record<string, string[]>; questions: string[] };
        return { ...m, files: { ...m.files, items: [...m.files.items!, m.files.items![0]!] } };
      }
      return read(rel);
    };
    await loadContent(fake, { onDuplicate: (id) => dupes.push(id) });
    expect(dupes.length).toBeGreaterThan(0);
  });

  it('壊れたスキーマはファイル名つきで落ちる', async () => {
    const fake: FileReader = async (rel) => (rel === 'balance/settings.json' ? { nope: true } : read(rel));
    await expect(loadContent(fake)).rejects.toThrow(/settings\.json/);
  });

  it('壊れた manifest は配下の処理へ渡さず、manifest の診断として落ちる', async () => {
    const fake: FileReader = async (rel) =>
      rel === 'manifest.json'
        ? { generatedAt: 'broken', files: { items: 'items/not-an-array.json' }, questions: [] }
        : read(rel);

    await expect(loadContent(fake)).rejects.toThrow(/manifest\.json: スキーマ違反/);
  });

  it('単一ファイルの種別が複数指定された manifest を黙って部分読込しない', async () => {
    const fake: FileReader = async (rel) => {
      if (rel !== 'manifest.json') return read(rel);
      const manifest = (await read(rel)) as { files: Record<string, string[]> };
      return {
        ...manifest,
        files: { ...manifest.files, settings: [...manifest.files.settings!, manifest.files.settings![0]!] },
      };
    };

    await expect(loadContent(fake)).rejects.toThrow(/settings.*1ファイル/);
  });

  it('本番用 reader は bundle を一度だけ取得して、複数ファイルを読む', async () => {
    const fetchMock = vi.fn(async () =>
      Promise.resolve(
        new Response(JSON.stringify({ 'a.json': { id: 'a' }, 'b.json': { id: 'b' } }), { status: 200 }),
      ),
    );
    vi.stubGlobal('fetch', fetchMock);
    const bundledRead = bundledFetchReader('/content');

    await expect(bundledRead('a.json')).resolves.toEqual({ id: 'a' });
    await expect(bundledRead('b.json')).resolves.toEqual({ id: 'b' });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith('/content/content-bundle.json', { cache: 'no-cache' });
  });

  it('bundle がない古い配信環境では個別 JSON の取得へ戻る', async () => {
    const fetchMock = vi.fn(async (url: string) =>
      url.endsWith('content-bundle.json')
        ? Promise.resolve(new Response(null, { status: 404 }))
        : Promise.resolve(new Response(JSON.stringify({ id: 'fallback' }), { status: 200 })),
    );
    vi.stubGlobal('fetch', fetchMock);

    await expect(bundledFetchReader('/content')('a.json')).resolves.toEqual({ id: 'fallback' });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('bundle の通信や解析に失敗しても個別 JSON の取得へ戻る', async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new TypeError('network error'))
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: 'fallback' }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(bundledFetchReader('/content')('a.json')).resolves.toEqual({ id: 'fallback' });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('bundle が壊れた JSON でも個別 JSON の取得へ戻る', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response('{broken', { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: 'fallback' }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(bundledFetchReader('/content')('a.json')).resolves.toEqual({ id: 'fallback' });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('bundle に目的ファイルが欠けていても個別 JSON の取得へ戻る', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ 'other.json': {} }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: 'fallback' }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(bundledFetchReader('/content')('a.json')).resolves.toEqual({ id: 'fallback' });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock).toHaveBeenLastCalledWith('/content/a.json', { cache: 'no-cache' });
  });

  it('問題専用 bundle を指定できる', async () => {
    const fetchMock = vi.fn(async () =>
      Promise.resolve(new Response(JSON.stringify({ 'questions/a.json': [] }), { status: 200 })),
    );
    vi.stubGlobal('fetch', fetchMock);
    await expect(
      bundledFetchReader('/content', 'questions-bundle.json')('questions/a.json'),
    ).resolves.toEqual([]);
    expect(fetchMock).toHaveBeenCalledWith('/content/questions-bundle.json', { cache: 'no-cache' });
  });
});
