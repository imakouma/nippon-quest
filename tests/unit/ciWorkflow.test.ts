import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const workflow = readFileSync(new URL('../../.github/workflows/ci.yml', import.meta.url), 'utf8');
const prebuiltConfig = readFileSync(new URL('../e2e/playwright.prebuilt.config.ts', import.meta.url), 'utf8');
const packageJson = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8')) as {
  scripts: Record<string, string>;
};

describe('CI workflow', () => {
  it('keeps the full E2E command and adds a production-build smoke command', () => {
    expect(packageJson.scripts['test:e2e']).toBe("playwright test --grep-invert '全問題をバトル問題枠'");
    expect(packageJson.scripts['test:e2e:smoke']).toBe(
      'playwright test --config tests/e2e/playwright.prebuilt.config.ts ci-smoke.spec.ts',
    );
  });

  it('cancels stale runs and splits full E2E coverage across four runners', () => {
    expect(workflow).toContain('cancel-in-progress: true');
    expect(workflow).toMatch(/\n {2}e2e:\n/);
    expect(workflow).toContain('shard: [1, 2, 3, 4]');
    expect(workflow).toContain('--shard=${{ matrix.shard }}/4');
  });

  it('reuses one production build and preserves shard diagnostics', () => {
    expect(workflow).toContain('uses: actions/upload-artifact@v4');
    expect(workflow).toContain('uses: actions/download-artifact@v4');
    expect(workflow.match(/name: production-build/g)).toHaveLength(2);
    expect(workflow).toContain('name: playwright-report-${{ matrix.shard }}');
    expect(workflow).toContain('if: failure()');
    expect(prebuiltConfig).toContain("['html', { open: 'never' }]");
    expect(prebuiltConfig).toContain("trace: 'retain-on-failure'");
    expect(prebuiltConfig).toContain("screenshot: 'only-on-failure'");
  });

  it('deploys Pages only after both quality gates succeed', () => {
    expect(workflow).toContain('needs: [check, e2e]');
  });
});
