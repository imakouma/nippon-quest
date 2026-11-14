export type Operation = 'add' | 'subtract' | 'multiply' | 'divide';
export interface CalculationRule {
  operation: Operation;
  stage?: string;
  leftMin: number;
  leftMax: number;
  rightMin: number;
  rightMax: number;
  carry: boolean;
  remainder?: boolean;
}
interface Stage {
  id: string;
  grade: number;
  operations: Operation[];
  leftMax: number;
  rightMax: number;
}
export const stages: Stage[] = [
  { id: 'digit', grade: 1, operations: ['add', 'subtract'], leftMax: 18, rightMax: 9 },
  { id: 'twenty', grade: 1, operations: ['add', 'subtract'], leftMax: 20, rightMax: 9 },
  { id: 'twoDigits', grade: 2, operations: ['add', 'subtract'], leftMax: 99, rightMax: 99 },
  { id: 'hundreds', grade: 2, operations: ['add', 'subtract'], leftMax: 900, rightMax: 900 },
  { id: 'kuku', grade: 2, operations: ['multiply'], leftMax: 9, rightMax: 9 },
  { id: 'tensMultiply', grade: 2, operations: ['multiply'], leftMax: 90, rightMax: 9 },
  { id: 'threeDigits', grade: 3, operations: ['add', 'subtract'], leftMax: 999, rightMax: 999 },
  { id: 'fourDigits', grade: 3, operations: ['add', 'subtract'], leftMax: 9999, rightMax: 9999 },
  { id: 'twoByOne', grade: 3, operations: ['multiply'], leftMax: 99, rightMax: 9 },
  { id: 'threeByOne', grade: 3, operations: ['multiply'], leftMax: 999, rightMax: 9 },
  { id: 'twoByTwo', grade: 3, operations: ['multiply'], leftMax: 99, rightMax: 99 },
  { id: 'division', grade: 3, operations: ['divide'], leftMax: 89, rightMax: 9 },
  { id: 'divisionTens', grade: 3, operations: ['divide'], leftMax: 99, rightMax: 9 },
];
export function stageDefaults(id: string, operation: Operation) {
  const stage = stages.find((s) => s.id === id && s.operations.includes(operation));
  if (!stage) throw new Error('invalid_calculation_stage');
  return {
    stage: id,
    operation,
    leftMin: ['threeDigits', 'threeByOne', 'hundreds'].includes(id)
      ? 100
      : id === 'fourDigits'
        ? 1000
        : ['twenty', 'twoDigits', 'tensMultiply', 'twoByOne', 'twoByTwo', 'divisionTens'].includes(id)
          ? 10
          : 1,
    leftMax: id === 'digit' && operation === 'add' ? 9 : stage.leftMax,
    rightMin: id === 'twoByTwo' ? 10 : id === 'hundreds' ? 100 : 1,
    rightMax: stage.rightMax,
    carry: false,
    remainder: false,
    response: 'text-input' as const,
  };
}
// Count digit-bounded integers without enumerating every pair of four-digit operands.
function noRegroupCount(limit: number, left: number, operation: Operation): number {
  if (limit < 0) return 0;
  const digits = String(limit).padStart(4, '0').split('').map(Number);
  const bounds = String(left)
    .padStart(4, '0')
    .split('')
    .map((n) => (operation === 'add' ? 9 - Number(n) : Number(n)));
  let tight = 1,
    loose = 0;
  for (let i = 0; i < 4; i++) {
    loose = loose * (bounds[i]! + 1) + tight * Math.min(digits[i]!, bounds[i]! + 1);
    tight = tight && digits[i]! <= bounds[i]! ? 1 : 0;
  }
  return loose + tight;
}
function specialPair(rule: CalculationRule, left: number, right: number): boolean {
  const stage = rule.stage ?? 'digit';
  if (
    stage === 'hundreds' &&
    (left % 100 !== 0 || right % 100 !== 0 || (rule.operation === 'add' && left + right > 900))
  )
    return false;
  if (stage === 'tensMultiply' && left % 10 !== 0) return false;
  if (rule.operation === 'divide') {
    const quotient = Math.floor(left / right),
      remainder = left % right;
    if (remainder > 0 !== Boolean(rule.remainder)) return false;
    if (stage === 'division') return quotient <= 9;
    return (
      quotient >= 10 && quotient <= 99 && Math.floor(left / 10) % right === 0 && (left % 10) % right === 0
    );
  }
  return true;
}
export function rightCount(rule: CalculationRule, left: number, limit = rule.rightMax): number {
  let low = rule.rightMin,
    high = Math.min(limit, rule.rightMax);
  if (rule.operation === 'subtract') {
    high = Math.min(high, left);
    if ((rule.stage ?? 'digit') === 'digit') low = Math.max(low, left - 9);
  }
  if (rule.operation === 'add' && rule.stage === 'twenty') high = Math.min(high, 20 - left);
  if (high < low) return 0;
  if (rule.stage === 'hundreds' || rule.operation === 'divide' || rule.stage === 'tensMultiply') {
    let count = 0;
    for (let right = low; right <= high; right++) {
      if (!specialPair(rule, left, right)) continue;
      if (rule.operation === 'add' || rule.operation === 'subtract') {
        const noRegroup =
          noRegroupCount(right, left, rule.operation) - noRegroupCount(right - 1, left, rule.operation) > 0;
        if (noRegroup === rule.carry) continue;
      }
      count++;
    }
    return count;
  }
  if (rule.operation === 'multiply') return high - low + 1;
  const plain = noRegroupCount(high, left, rule.operation) - noRegroupCount(low - 1, left, rule.operation);
  return rule.carry ? high - low + 1 - plain : plain;
}
export function validRule(rule: CalculationRule): boolean {
  const stage = stages.find((s) => s.id === (rule.stage ?? 'digit'));
  if (!stage || !stage.operations.includes(rule.operation)) return false;
  if (
    rule.leftMin > rule.leftMax ||
    rule.rightMin > rule.rightMax ||
    rule.leftMax > stage.leftMax ||
    rule.rightMax > stage.rightMax
  )
    return false;
  if (rule.operation === 'add' && (rule.stage ?? 'digit') === 'digit' && rule.leftMax > 9) return false;
  if (rule.operation === 'divide' && rule.rightMin < 1) return false;
  if (rule.remainder && (rule.operation !== 'divide' || rule.stage === 'divisionTens')) return false;
  if (rule.carry && (rule.operation === 'multiply' || rule.operation === 'divide')) return false;
  for (let left = rule.leftMin; left <= rule.leftMax; left++) if (rightCount(rule, left) > 0) return true;
  return false;
}
