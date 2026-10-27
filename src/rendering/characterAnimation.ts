import entries from '../../assets/sprites/animations/batch-01/characters.json';

export type CharacterAnimationIntegration = 'fixed-character' | 'customizable-reference';

export interface CharacterAnimationSpec {
  id: string;
  key: string;
  path: string;
  frameWidth: number;
  frameHeight: number;
  idle: number[];
  attack: number[];
  integration: CharacterAnimationIntegration;
}

const specs = new Map((entries as CharacterAnimationSpec[]).map((entry) => [entry.id, entry] as const));

/** 制作済み人物素材。主人公を含め、資料室や統合側の目視確認に使う。 */
export function characterAnimationReference(id: string): CharacterAnimationSpec | undefined {
  return specs.get(id);
}

/**
 * 固定外見の人物だけを返す。主人公は外見カスタマイズと4方向歩行を維持するため、
 * 固定画像へ自動的に置き換えない。
 */
export function fixedCharacterAnimationSpec(id: string): CharacterAnimationSpec | undefined {
  const spec = specs.get(id);
  return spec?.integration === 'fixed-character' ? spec : undefined;
}
