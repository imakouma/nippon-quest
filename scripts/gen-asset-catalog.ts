/** assets/catalog.json を生成し、AIや監査ツールが素材の配置を全走査せず把握できるようにする。 */
import { readdirSync, statSync, writeFileSync } from 'node:fs';
import { extname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { format, resolveConfig } from 'prettier';

const ROOT = fileURLToPath(new URL('../assets/', import.meta.url));
const OUTPUT = 'catalog.json';

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (name.startsWith('.')) continue;
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path, out);
    else if (name !== OUTPUT) out.push(relative(ROOT, path).split(sep).join('/'));
  }
  return out;
}

const files = walk(ROOT).sort();
const totalBytes = files.reduce((sum, file) => sum + statSync(join(ROOT, file)).size, 0);
const categoryNames = [...new Set(files.map((file) => file.split('/')[0] ?? 'root'))].sort();
const categories = Object.fromEntries(
  categoryNames.map((name) => {
    const entries = files.filter((file) => file === name || file.startsWith(`${name}/`));
    const subdirectories = [
      ...new Set(
        entries.flatMap((file) => {
          const parts = file.split('/');
          return parts.length > 2 ? [parts[1]!] : [];
        }),
      ),
    ].sort();
    const extensions = [...new Set(entries.map((file) => extname(file).slice(1) || '(none)'))].sort();
    return [name, { fileCount: entries.length, extensions, subdirectories }];
  }),
);

const catalog = {
  source: 'assets/',
  fileCount: files.length,
  totalBytes,
  categories,
  files,
};

const prettier = { ...((await resolveConfig(join(ROOT, OUTPUT))) ?? {}), parser: 'json' };
writeFileSync(join(ROOT, OUTPUT), await format(JSON.stringify(catalog), prettier));
console.log(`asset catalog: ${files.length} files (${categoryNames.length} categories)`);
