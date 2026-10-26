import { describe, expect, it } from 'vitest';
import {
  assessPerformanceBudget,
  DEFAULT_PERFORMANCE_BUDGET,
  type PerformanceSnapshot,
} from '../../scripts/check-performance-budget';

function snapshot(overrides: Partial<PerformanceSnapshot> = {}): PerformanceSnapshot {
  return {
    initialJsGzipBytes: DEFAULT_PERFORMANCE_BUDGET.initialJsGzipBytes,
    initialCssGzipBytes: DEFAULT_PERFORMANCE_BUDGET.initialCssGzipBytes,
    contentBundleBytes: DEFAULT_PERFORMANCE_BUDGET.contentBundleBytes,
    ...overrides,
  };
}

describe('assessPerformanceBudget', () => {
  it('accepts artifacts exactly on every budget boundary', () => {
    expect(assessPerformanceBudget(snapshot())).toEqual([]);
  });

  it('reports every artifact that exceeds its budget', () => {
    expect(
      assessPerformanceBudget(
        snapshot({
          initialJsGzipBytes: DEFAULT_PERFORMANCE_BUDGET.initialJsGzipBytes + 1,
          initialCssGzipBytes: DEFAULT_PERFORMANCE_BUDGET.initialCssGzipBytes + 2,
          contentBundleBytes: DEFAULT_PERFORMANCE_BUDGET.contentBundleBytes + 3,
        }),
      ),
    ).toEqual([
      expect.stringContaining('initial JS'),
      expect.stringContaining('initial CSS'),
      expect.stringContaining('content bundle'),
    ]);
  });
});
