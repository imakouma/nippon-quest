import { PREFECTURES } from '../data/prefectures.js';

export function mapGenerationOptions(args: readonly string[]) {
  const force = args.includes('--force');
  const townsOnly = args.includes('--towns-only');
  const worldMapOnly = args.includes('--worldmap-only');
  const linksOnly = args.includes('--links-only');
  const selections = args.filter((arg) => arg.startsWith('--only='));
  const only = selections[0]?.slice('--only='.length);
  if (
    args.includes('--only') ||
    selections.length > 1 ||
    (only !== undefined && !PREFECTURES.some((pref) => pref.id === only))
  )
    throw new Error('Specify exactly one known prefecture with --only=<id>.');
  if ([townsOnly, worldMapOnly, linksOnly].filter(Boolean).length > 1 || (worldMapOnly && only))
    throw new Error('Map generation modes conflict; --worldmap-only cannot select a prefecture.');
  return { force, townsOnly, worldMapOnly, linksOnly, only };
}
