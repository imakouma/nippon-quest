import { useEffect, useRef, useState } from 'preact/hooks';
import { folderStateSchema, type FolderLayout, type FolderState } from './folderLayout';

const base = import.meta.env.BASE_URL.replace(/\/$/, '');

async function request(data: unknown): Promise<FolderState> {
  const response = await fetch(`${base}/__nq/folder-state`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-nq-save': '1' },
    body: JSON.stringify(data),
  });
  const result: unknown = await response.json();
  if (!response.ok) {
    const message = (result as { error?: string }).error;
    throw new Error(message || 'フォルダ構成を保存できませんでした');
  }
  return folderStateSchema.parse(result);
}

export function useFolderState() {
  const [state, setState] = useState<FolderState | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [history, setHistory] = useState<FolderLayout[]>([]);
  const pending = useRef(false);
  useEffect(() => {
    void request({ action: 'read' })
      .then(setState)
      .catch((e: Error) => setError(e.message));
  }, []);

  const save = async (next: FolderState, previous?: FolderLayout) => {
    if (!state || pending.current) return false;
    pending.current = true;
    setBusy(true);
    try {
      const saved = await request({ action: 'write', expected: state.revision, state: next });
      setState(saved);
      if (previous) setHistory((old) => [...old, previous]);
      setError('');
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : '保存できませんでした');
      return false;
    } finally {
      pending.current = false;
      setBusy(false);
    }
  };

  const change = (layout: FolderLayout) => state && save({ ...state, layout }, state.layout);
  const undo = async () => {
    if (!state || !history.length) return;
    if (await save({ ...state, layout: history[history.length - 1]! })) setHistory((old) => old.slice(0, -1));
  };
  const snapshot = () => {
    if (!state) return;
    const item = { id: crypto.randomUUID(), createdAt: new Date().toISOString(), layout: state.layout };
    void save({ ...state, snapshots: [...state.snapshots, item] });
  };
  const restore = (id: string) => {
    if (!state) return;
    const target = state.snapshots.find((item) => item.id === id);
    if (!target || !window.confirm('保存したフォルダ構成に戻しますか？')) return;
    const before = { id: crypto.randomUUID(), createdAt: new Date().toISOString(), layout: state.layout };
    void save({ ...state, layout: target.layout, snapshots: [...state.snapshots, before] }, state.layout);
  };
  return { state, error, busy, canUndo: history.length > 0, change, undo, snapshot, restore };
}
