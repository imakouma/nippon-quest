/**
 * システム文言（content/i18n/ja.json）の参照。コードに文言を書かないためのヘルパー（.agent/rules 6）。
 * キーは "battle.appear" のようなドット区切り。"{name}" 形式のプレースホルダを vars で埋める。
 * 見つからないキーはキー文字列をそのまま返す（画面に出るので気づける）。
 */
export type I18nDict = Record<string, unknown>;
export type I18nVars = Record<string, string | number>;

let dict: I18nDict = {};
const warned = new Set<string>();

export function setDictionary(d: I18nDict): void {
  dict = d;
}

export function lookup(d: I18nDict, key: string): string | undefined {
  let cur: unknown = d;
  for (const part of key.split('.')) {
    if (cur === null || typeof cur !== 'object') return undefined;
    cur = (cur as Record<string, unknown>)[part];
  }
  return typeof cur === 'string' ? cur : undefined;
}

export function format(template: string, vars: I18nVars = {}): string {
  return template.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m));
}

export function t(key: string, vars?: I18nVars): string {
  const s = lookup(dict, key);
  if (s === undefined) {
    if (!warned.has(key)) {
      warned.add(key);
      console.warn(`[i18n] キーがありません: ${key}`);
    }
    return key;
  }
  return format(s, vars);
}

/** あれば その 文言、無ければ undefined（警告を 出さない。演出の 字など、無くても よい もの） */
export function tOpt(key: string): string | undefined {
  return lookup(dict, key);
}
