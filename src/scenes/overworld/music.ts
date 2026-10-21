import type { MusicTrack } from '../../ui/bgm';
import { mapKind } from './geography';

export function mapMusicTrack(mapKey: string): MusicTrack {
  const kind = mapKind(mapKey);
  return kind === 'enclave' ? 'field' : kind;
}
