import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { migrateAcademicValue } from './academic-stats-migration';

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

export interface AcademicStatsMigrationResult {
  filesChanged: number;
  objectsChanged: number;
  skillsChanged: number;
}

export async function migrateAcademicStats(
  baseDir: string,
  write: boolean,
): Promise<AcademicStatsMigrationResult> {
  let filesChanged = 0;
  let objectsChanged = 0;
  for (const root of ['content/monsters', 'content/items']) {
    for (const file of await jsonFiles(path.join(baseDir, root))) {
      const json = JSON.parse(await readFile(file, 'utf8')) as unknown;
      const count = migrateAcademicValue(json);
      if (!count) continue;
      filesChanged += 1;
      objectsChanged += count;
      if (write) await writeFile(file, `${JSON.stringify(json, null, 2)}\n`);
    }
  }

  const skillsFile = path.join(baseDir, 'content/skills.json');
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
  return { filesChanged, objectsChanged, skillsChanged };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const write = process.argv.includes('--write');
  const result = await migrateAcademicStats(process.cwd(), write);
  console.log(
    `${write ? 'updated' : 'would update'} ${result.objectsChanged} stat objects in ${result.filesChanged} files and ${result.skillsChanged} skill classes`,
  );
}
