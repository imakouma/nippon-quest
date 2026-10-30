import type { ComponentChildren } from 'preact';
import { tOpt } from '../ui/i18n';
import { stripRuby } from '../ui/ruby';
import { removeFolder, type FolderLayout } from './folderLayout';
import type { useFolderState } from './useFolderState';

type FolderTools = ReturnType<typeof useFolderState>;
const text = (key: string) => stripRuby(tOpt(`tools.playground.${key}`) ?? '', 'kanji');

export function FolderControls({ tools }: { tools: FolderTools }) {
  const { state, busy, error, undo, canUndo, snapshot, restore } = tools;
  return (
    <div class="pg-folder-controls">
      <button type="button" disabled={!state || busy || !canUndo} onClick={() => void undo()}>
        {text('folderUndo')}
      </button>
      <button type="button" disabled={!state || busy} onClick={snapshot}>
        {text('folderSnapshot')}
      </button>
      <select
        aria-label={text('folderRestore')}
        disabled={!state || busy || !state.snapshots.length}
        value=""
        onChange={(event) => {
          const input = event.currentTarget as HTMLSelectElement;
          if (input.value) restore(input.value);
          input.value = '';
        }}
      >
        <option value="">{text('folderRestore')}</option>
        {state?.snapshots.map((snapshot) => (
          <option value={snapshot.id}>{new Date(snapshot.createdAt).toLocaleString('ja-JP')}</option>
        ))}
      </select>
      {error && <p role="alert">{error}</p>}
    </div>
  );
}

export function CustomFolders({
  tools,
  subject,
  grade,
  selected,
  onSelect,
  questions,
  count,
  category,
}: {
  tools: FolderTools;
  subject: string;
  grade: number;
  selected: string | null | undefined;
  onSelect: (id: string | undefined) => void;
  questions: ComponentChildren;
  count: (id: string | null) => number;
  category?: 'reading' | 'writing' | 'review';
}) {
  const layout = tools.state?.layout;
  if (!layout) return null;
  const add = (parent: string | null) => {
    const name = window.prompt(text('folderName'))?.trim();
    if (!name || name.length > 80) return;
    const folder = {
      id: crypto.randomUUID(),
      name,
      subject,
      grade,
      parent,
      ...(category ? { category } : {}),
    } as FolderLayout['folders'][number];
    void tools.change({ ...layout, folders: [...layout.folders, folder] });
  };
  const renderFolder = (parent: string | null): ComponentChildren =>
    layout.folders
      .filter(
        (f) => f.subject === subject && f.grade === grade && f.parent === parent && f.category === category,
      )
      .map((folder) => {
        const scope = `custom:${folder.id}`;
        return (
          <details class="pg-custom-folder" key={folder.id}>
            <summary>
              {folder.name}{' '}
              <span class="pg-tree-count">
                {count(folder.id)}
                {text('questionSuffix')}
              </span>
            </summary>
            <div class="pg-folder-actions">
              <button
                type="button"
                disabled={tools.busy}
                onClick={() => onSelect(selected === scope ? undefined : scope)}
              >
                {text('folderShow')}
              </button>
              <button type="button" disabled={tools.busy} onClick={() => add(folder.id)}>
                {text('folderAdd')}
              </button>
              <button
                type="button"
                disabled={tools.busy}
                onClick={() => {
                  const descendants = new Set([folder.id]);
                  for (let changed = true; changed;) {
                    changed = false;
                    for (const child of layout.folders) {
                      if (child.parent && descendants.has(child.parent) && !descendants.has(child.id)) {
                        descendants.add(child.id);
                        changed = true;
                      }
                    }
                  }
                  const total = [...descendants].reduce((sum, id) => sum + count(id), 0);
                  if (
                    window.confirm(
                      `${folder.name}（${total}${text('questionSuffix')}）\n${text('folderDeleteConfirm')}`,
                    )
                  )
                    void tools.change(removeFolder(layout, folder.id));
                }}
              >
                {text('folderDelete')}
              </button>
            </div>
            {selected === scope && questions}
            {renderFolder(folder.id)}
          </details>
        );
      });
  const unfiled = `unfiled:${subject}:${grade}`;
  return (
    <div class="pg-custom-folders">
      <div class="pg-folder-actions">
        <button type="button" disabled={tools.busy} onClick={() => add(null)}>
          {text('folderAdd')}
        </button>
      </div>
      {renderFolder(null)}
      {!category && count(null) > 0 && (
        <div>
          <button
            type="button"
            aria-pressed={selected === unfiled}
            onClick={() => onSelect(selected === unfiled ? undefined : unfiled)}
          >
            {text('folderUnfiled')}{' '}
            <span class="pg-tree-count">
              {count(null)}
              {text('questionSuffix')}
            </span>
          </button>
          {selected === unfiled && questions}
        </div>
      )}
    </div>
  );
}
