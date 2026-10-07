import type { Subject } from '../content/schemas';

export type MvpRegionId = 'tohoku' | 'koshinetsu';

export interface MvpStarter {
  id: string;
  name: string;
  element: 'hino' | 'mizu' | 'mori' | 'tsuchi';
  mark: string;
  subject: Subject;
}

export interface MvpRegion {
  id: MvpRegionId;
  name: string;
  shortName: string;
  description: string;
  subjects: Subject[];
  startArea: string;
  startMap: string;
  startPosition: { x: number; y: number };
  initialSkill: string;
  starters: MvpStarter[];
}

export const MVP_REGIONS: readonly MvpRegion[] = [
  {
    id: 'tohoku',
    name: '東北[とうほく]地方[ちほう]',
    shortName: 'とうほく',
    description: 'ことばと くらしの ものがたり',
    subjects: ['kokugo', 'seikatsu'],
    startArea: 'aomori',
    startMap: 'aomori-field',
    startPosition: { x: 976, y: 1104 },
    initialSkill: 'sk-hinoko',
    starters: [
      { id: 'aomori-nebutan', name: 'ネブタン', element: 'hino', mark: '炎', subject: 'kokugo' },
      { id: 'aomori-magurodo', name: 'マグロード', element: 'mizu', mark: '波', subject: 'kokugo' },
      { id: 'aomori-ringoron', name: 'リンゴロン', element: 'mori', mark: '葉', subject: 'seikatsu' },
    ],
  },
  {
    id: 'koshinetsu',
    name: '甲信越[こうしんえつ]地方[ちほう]',
    shortName: 'こうしんえつ',
    description: 'かずと けいさんの ぼうけん',
    subjects: ['sansu'],
    startArea: 'niigata',
    startMap: 'niigata-field',
    startPosition: { x: 880, y: 560 },
    initialSkill: 'sk-kazoe-giri',
    starters: [
      { id: 'niigata-hisui-koro', name: 'ヒスイコロ', element: 'tsuchi', mark: '数', subject: 'sansu' },
      { id: 'yamanashi-suzurin', name: 'スズリン', element: 'tsuchi', mark: '＋', subject: 'sansu' },
      { id: 'nagano-zaru-soban', name: 'ザルソバン', element: 'tsuchi', mark: '算', subject: 'sansu' },
    ],
  },
] as const;

export function mvpRegion(id: MvpRegionId | undefined): MvpRegion {
  return MVP_REGIONS.find((region) => region.id === id) ?? MVP_REGIONS[0]!;
}
