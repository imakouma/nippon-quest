import { ENCLAVES } from '../../../scripts/data/prefectures';
import type { Area } from '../../core/content/schemas';
import { t } from '../../ui/i18n';
import { stripRuby } from '../../ui/ruby';
import type { MapKind } from './geography';

/** HUD と場所到着演出に出す地名を、マップ種別から組み立てる。 */
export function fieldPlaceName(
  kind: MapKind,
  area: Area | undefined,
  mapKey: string,
  regionName?: string,
): { title: string; sub: string } {
  const enclave = kind === 'enclave' ? ENCLAVES.find((entry) => entry.enclaveId === mapKey) : undefined;
  const title =
    enclave?.name ??
    (kind === 'town' ? area?.town?.name : kind === 'secret' ? area?.secret?.name : undefined) ??
    area?.name ??
    mapKey;
  if (regionName) return { title, sub: stripRuby(regionName, 'kana') };
  return {
    title,
    sub: t(
      {
        field: 'field.kindField',
        town: 'field.kindTown',
        dungeon: 'field.kindDungeon',
        enclave: 'field.kindEnclave',
        secret: 'field.kindSecret',
      }[kind],
    ),
  };
}
