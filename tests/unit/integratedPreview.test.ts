import { afterEach, expect, it } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { assertIntegrationRoot, integrationBranch, integrationRoot } from '../../scripts/integrated-preview';

const folders: string[] = [];
afterEach(() => {
  for (const path of folders.splice(0)) rmSync(path, { recursive: true, force: true });
});

it('routes a task worktree to the integrated checkout and rejects serving the task on 4174', () => {
  const base = mkdtempSync(join(tmpdir(), 'nq-preview-test-'));
  folders.push(base);
  const shared = join(base, 'shared');
  const task = join(base, 'task');
  execFileSync('git', ['init', '-b', integrationBranch, shared]);
  const git = (...args: string[]) => execFileSync('git', args, { cwd: shared, stdio: 'pipe' });
  git(
    '-c',
    'user.name=Test',
    '-c',
    'user.email=test@example.invalid',
    'commit',
    '--allow-empty',
    '-m',
    'initial',
  );
  git('worktree', 'add', '-b', 'codex/task', task);
  expect(integrationRoot(task)).toBe(integrationRoot(shared));
  expect(() => assertIntegrationRoot(shared)).not.toThrow();
  expect(() => assertIntegrationRoot(task)).toThrow('4174 は統合版専用');
  git('branch', '-m', 'codex/renamed');
  expect(() => integrationRoot(task)).toThrow('worktree がありません');
});
