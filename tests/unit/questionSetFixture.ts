import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/** 正規化済み単元フォルダの set-NNN.json を番号順にまとめて読む。 */
export function readUnitQuestionSets<T>(...pathSegments: string[]): T[] {
  const directory = join(process.cwd(), 'content/questions', ...pathSegments);
  return readdirSync(directory)
    .filter((name) => /^set-\d{3}\.json$/.test(name))
    .sort()
    .flatMap((name) => JSON.parse(readFileSync(join(directory, name), 'utf8')) as T[]);
}
