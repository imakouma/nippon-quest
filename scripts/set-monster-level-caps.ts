import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const MINIMUM_LEVEL_CAP = 10;
const MAXIMUM_INITIAL_LEVEL_CAP = 60;

interface MonsterCapSource {
  id: string;
  area: string;
  skills: string[];
}

interface SkillSource {
  id: string;
  gradeRange: [number, number];
}

interface IslandSource {
  areas: string[];
  recommendedGrade: [number, number];
}

export function suggestInitialLevelCap(
  monster: MonsterCapSource,
  skillMinimumGrades: ReadonlyMap<string, number>,
  areaMinimumGrades: ReadonlyMap<string, number>,
): number {
  const skillGrades = monster.skills.flatMap((skillId) => {
    const grade = skillMinimumGrades.get(skillId);
    return grade === undefined ? [] : [grade];
  });
  const grade = skillGrades.length ? Math.min(...skillGrades) : (areaMinimumGrades.get(monster.area) ?? 1);
  return Math.min(MAXIMUM_INITIAL_LEVEL_CAP, Math.max(MINIMUM_LEVEL_CAP, grade * 10));
}

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, 'utf8')) as T;
}

function main(): void {
  const contentDirectory = fileURLToPath(new URL('../content/', import.meta.url));
  const skills = readJson<SkillSource[]>(resolve(contentDirectory, 'skills.json'));
  const world = readJson<{ islands: IslandSource[] }>(resolve(contentDirectory, 'world/japan.json'));
  const skillMinimumGrades = new Map(skills.map((skill) => [skill.id, skill.gradeRange[0]]));
  const areaMinimumGrades = new Map(
    world.islands.flatMap((island) =>
      island.areas.map((areaId) => [areaId, island.recommendedGrade[0]] as const),
    ),
  );

  const monsterDirectory = resolve(contentDirectory, 'monsters');
  const files = readdirSync(monsterDirectory)
    .filter((file) => file.endsWith('.json'))
    .sort();
  const distribution = new Map<number, number>();

  for (const file of files) {
    const path = resolve(monsterDirectory, file);
    const monster = readJson<MonsterCapSource & Record<string, unknown>>(path);
    const initialLevelCap = suggestInitialLevelCap(monster, skillMinimumGrades, areaMinimumGrades);
    writeFileSync(path, `${JSON.stringify({ ...monster, initialLevelCap }, null, 2)}\n`);
    distribution.set(initialLevelCap, (distribution.get(initialLevelCap) ?? 0) + 1);
  }

  console.log(
    `monster level caps: ${files.length} files (${[...distribution.entries()]
      .sort(([left], [right]) => left - right)
      .map(([cap, count]) => `Lv${cap}=${count}`)
      .join(', ')})`,
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) main();
