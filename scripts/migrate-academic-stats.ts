import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const write = process.argv.includes('--write');
const roots = ['content/monsters', 'content/items'];

const scaled = (value: unknown, factor: number) =>
  typeof value === 'number' ? Math.max(value > 0 ? 1 : 0, Math.round(value * factor * 10) / 10) : value;

function academic(object: Record<string, unknown>, scale: boolean): boolean {
  if (!('atk' in object) && !('def' in object)) return false;
  const atk = scale ? scaled(object.atk, 0.625) : object.atk;
  const def = scale ? scaled(object.def, 2 / 3) : object.def;
  if (atk !== undefined) {
    object.scienceAtk = atk;
    object.humanitiesAtk = atk;
    delete object.atk;
  }
  if (def !== undefined) {
    object.scienceDef = def;
    object.humanitiesDef = def;
    delete object.def;
  }
  return true;
}

function visit(value: unknown, parentKey = ''): number {
  if (Array.isArray(value)) return value.reduce((sum, item) => sum + visit(item, parentKey), 0);
  if (!value || typeof value !== 'object') return 0;
  const object = value as Record<string, unknown>;
  let changed = 0;
  if (parentKey === 'baseStats') {
    object.hp = scaled(object.hp, 0.6);
    object.mp = scaled(object.mp, 0.6);
    object.spd = scaled(object.spd, 5 / 7);
    object.wis = scaled(object.wis, 0.6);
    changed += academic(object, true) ? 1 : 0;
  } else if (parentKey === 'growth') {
    const legacy = { ...object };
    if (academic(legacy, true)) {
      const base = legacy;
      base.hp = scaled(base.hp, 0.6);
      base.mp = scaled(base.mp, 0.6);
      base.spd = scaled(base.spd, 5 / 7);
      base.wis = scaled(base.wis, 0.6);
      for (const key of Object.keys(object)) delete object[key];
      object.base = base;
      object.every5 = {
        hp: 2,
        mp: 1,
        scienceAtk: 1,
        humanitiesAtk: 1,
        scienceDef: 1,
        humanitiesDef: 1,
        spd: 1,
        wis: 0,
      };
      object.every10 = {
        hp: 3,
        mp: 1,
        scienceAtk: 1,
        humanitiesAtk: 1,
        scienceDef: 1,
        humanitiesDef: 1,
        spd: 1,
        wis: 1,
      };
      changed += 1;
    }
  } else if (parentKey === 'stats') {
    changed += academic(object, true) ? 1 : 0;
  }
  for (const [key, child] of Object.entries(object)) changed += visit(child, key);
  return changed;
}

async function jsonFiles(root: string): Promise<string[]> {
  const entries = await readdir(root, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map((entry) => {
      const target = path.join(root, entry.name);
      return entry.isDirectory()
        ? jsonFiles(target)
        : Promise.resolve(target.endsWith('.json') ? [target] : []);
    }),
  );
  return nested.flat();
}

let filesChanged = 0;
let objectsChanged = 0;
for (const root of roots) {
  for (const file of await jsonFiles(root)) {
    const json = JSON.parse(await readFile(file, 'utf8')) as unknown;
    const count = visit(json);
    if (!count) continue;
    filesChanged += 1;
    objectsChanged += count;
    if (write) await writeFile(file, `${JSON.stringify(json, null, 2)}\n`);
  }
}

const skillsFile = 'content/skills.json';
const skills = JSON.parse(await readFile(skillsFile, 'utf8')) as Array<Record<string, unknown>>;
let skillsChanged = 0;
for (const skill of skills) {
  if (skill.attackClass !== undefined) continue;
  skill.attackClass =
    skill.subject === 'sansu' || skill.subject === 'rika'
      ? 'science'
      : skill.subject === 'seikatsu'
        ? 'balanced'
        : 'humanities';
  skillsChanged += 1;
}
if (write && skillsChanged) await writeFile(skillsFile, `${JSON.stringify(skills, null, 2)}\n`);

console.log(
  `${write ? 'updated' : 'would update'} ${objectsChanged} stat objects in ${filesChanged} files and ${skillsChanged} skill classes`,
);
