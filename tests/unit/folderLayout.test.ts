import { describe, expect, it } from 'vitest';
import { folderLayoutSchema, isUnfiled, removeFolder, type FolderLayout } from '../../src/tools/folderLayout';
import type { QuestionBase } from '../../src/questions/contracts';

describe('問題フォルダの構成', () => {
  it('フォルダ削除時はその配下の問題を未整理に移す', () => {
    const layout: FolderLayout = {
      folders: [
        { id: 'parent', name: 'まとめ', subject: 'sansu', grade: 1, parent: null },
        { id: 'child', name: '子', subject: 'sansu', grade: 1, parent: 'parent' },
        { id: 'other', name: '別', subject: 'sansu', grade: 1, parent: null },
      ],
      assignments: { q1: 'parent', q2: 'child', q3: 'other' },
      hidden: [],
    };
    const result = removeFolder(layout, 'parent');
    expect(result.folders).toEqual([{ id: 'other', name: '別', subject: 'sansu', grade: 1, parent: null }]);
    expect(result.assignments).toEqual({ q1: null, q2: null, q3: 'other' });
    expect(layout.folders).toHaveLength(3);
  });

  it('循環や存在しない親を拒否する', () => {
    expect(
      folderLayoutSchema.safeParse({
        folders: [{ id: 'a', name: '循環', subject: 'sansu', grade: 1, parent: 'a' }],
        assignments: {},
        hidden: [],
      }).success,
    ).toBe(false);
  });

  it('削除された元フォルダに後から追加された問題も未整理で見つかる', () => {
    const question = {
      id: 'sansu.g1.foo.1',
      unit: 'sansu.g1.foo',
      subject: 'sansu',
      grade: 1,
    } as QuestionBase;
    const layout = { folders: [], assignments: {}, hidden: ['sansu:1::sansu.g1.foo'] };
    expect(isUnfiled(question, new Map(), layout)).toBe(true);
  });

  it('存在しない移動先を拒否する', () => {
    expect(
      folderLayoutSchema.safeParse({ folders: [], assignments: { q: 'missing' }, hidden: [] }).success,
    ).toBe(false);
  });
});
