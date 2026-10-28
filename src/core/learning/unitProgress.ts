import { canonicalUnitId } from './unitAliases';

export interface UnitMasteryRecord {
  value: number;
  n: number;
  lastAt: number;
}

interface MasteryTotal {
  weightedValue: number;
  weight: number;
  n: number;
  lastAt: number;
}

export function aggregateUnitMastery(
  mastery: Readonly<Record<string, Readonly<UnitMasteryRecord>>>,
): Readonly<Record<string, UnitMasteryRecord>> {
  const totals = new Map<string, MasteryTotal>();

  for (const [unitId, record] of Object.entries(mastery)) {
    const canonicalId = canonicalUnitId(unitId);
    const recordWeight = Math.max(1, record.n);
    const total = totals.get(canonicalId) ?? {
      weightedValue: 0,
      weight: 0,
      n: 0,
      lastAt: Number.NEGATIVE_INFINITY,
    };

    total.weightedValue += record.value * recordWeight;
    total.weight += recordWeight;
    total.n += record.n;
    total.lastAt = Math.max(total.lastAt, record.lastAt);
    totals.set(canonicalId, total);
  }

  return Object.fromEntries(
    [...totals].map(([unitId, total]) => [
      unitId,
      {
        value: total.weightedValue / total.weight,
        n: total.n,
        lastAt: total.lastAt,
      },
    ]),
  );
}
