/**
 * Question Playground（docs/01 §3.4）
 * ゲームを起動せず、任意の問題 JSON をレンダラーで表示し、QuestionResult を確認する。
 * 問題作成者と UI 担当の共通デバッグ画面。ステージの下は content/questions の 問題いちらん（開発用）。
 */
import { render } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import {
  questionBaseSchema,
  type Grade,
  type QuestionBase,
  type QuestionResult,
} from '../questions/contracts';
import { allRenderers, getRenderer } from '../questions/renderers/registry';
import { fetchReader } from '../core/content/loader';
import type { ContentManifest } from '../core/content/loader';
import { setDictionary, type I18nDict } from '../ui/i18n';
import { createSpeaker } from '../ui/overlay';
import { kanjiGradeTable, setKanjiLevel, type KanjiGradeTable } from '../ui/ruby';
import { QuestionList, type QuestionEntry } from './QuestionList';
import '../questions/renderers/shared/questions.css';
import './playground.css';

const base = import.meta.env.BASE_URL.replace(/\/$/, '');
const read = fetchReader(`${base}/content`);
const assets = { image: (p: string) => `${base}/assets/${p}`, audio: (p: string) => `${base}/assets/${p}` };
// ゲームと同じ 読み上げ（英語だけの 文は 英語の 声）
const speak = createSpeaker();

const issues = (e: { issues: { path: (string | number)[]; message: string }[] }) =>
  e.issues.map((i) => `${i.path.join('.') || '(ぜんたい)'}: ${i.message}`).join('; ');

/** 問題 1 つを ゲーム（QuestionBank）と同じ 手順で たしかめる */
function checkQuestion(file: string, index: number, raw: unknown): QuestionEntry {
  const key = `${file}#${index}`;
  const b = questionBaseSchema.safeParse(raw);
  if (!b.success) return { key, file, index, raw, q: null, problem: issues(b.error) };
  const q = b.data as QuestionBase;
  const r = getRenderer(q.type);
  if (!r) return { key, file, index, raw, q, problem: `未登録の問題タイプ "${q.type}"` };
  const p = r.schema.safeParse(q.payload);
  return p.success
    ? { key, file, index, raw, q: { ...q, payload: p.data }, problem: null }
    : { key, file, index, raw, q, problem: `payload: ${issues(p.error)}` };
}

/** 問題ファイル ぜんぶを いちらん用に（id の 重複も エラーにする） */
function toEntries(files: { file: string; raw: unknown }[]): QuestionEntry[] {
  const list = files.flatMap(({ file, raw }) =>
    Array.isArray(raw)
      ? raw.map((r, i) => checkQuestion(file, i, r))
      : [{ key: `${file}#-1`, file, index: -1, raw, q: null, problem: '問題ファイルが 配列では ありません' }],
  );
  const count = new Map<string, number>();
  for (const e of list) if (e.q) count.set(e.q.id, (count.get(e.q.id) ?? 0) + 1);
  return list.map((e) =>
    e.q && !e.problem && (count.get(e.q.id) ?? 0) > 1 ? { ...e, problem: `id "${e.q.id}" が 重複` } : e,
  );
}

function App() {
  const [files, setFiles] = useState<string[]>([]);
  const [file, setFile] = useState('');
  const [items, setItems] = useState<QuestionBase[]>([]);
  const [entries, setEntries] = useState<QuestionEntry[]>([]);
  const [units, setUnits] = useState<ReadonlyMap<string, string>>(new Map());
  const [subjects, setSubjects] = useState<ReadonlyMap<string, string>>(new Map());
  const [kanji, setKanji] = useState<{ table: KanjiGradeTable; names: ReadonlySet<string> } | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [json, setJson] = useState('');
  const [grade, setGrade] = useState<Grade>(3);
  const [timeLimit, setTimeLimit] = useState(20);
  const [result, setResult] = useState<QuestionResult | null>(null);
  const [error, setError] = useState('');
  const [running, setRunning] = useState(false);
  const stage = useRef<HTMLDivElement>(null);
  const abort = useRef<AbortController | null>(null);
  const runId = useRef(0);
  const opened = useRef(false);

  // 漢字表示レベル：ゲームと同じく、えらんだ学年で まだ習っていない 漢字の ことばは ひらがなで 出す。
  // いちらんの 文字も ステージの 問題も この設定で 描くので、子を 描く前（ここ）で きめる
  if (kanji) setKanjiLevel({ grade, table: kanji.table, names: kanji.names });

  const loadAll = async () => {
    try {
      const m = (await read('manifest.json')) as ContentManifest;
      setFiles(m.questions);
      setEntries(
        toEntries(await Promise.all(m.questions.map(async (f) => ({ file: f, raw: await read(f) })))),
      );
    } catch (e) {
      setError(String(e));
    }
  };

  useEffect(() => {
    void loadAll();
    read('units.json')
      .then((u) => setUnits(new Map((u as { id: string; name: string }[]).map((x) => [x.id, x.name]))))
      .catch((e) => setError(String(e)));
    // レンダラーが使う 文言（content/i18n/ja.json）
    read('i18n/ja.json')
      .then((d) => {
        setDictionary(d as I18nDict);
        setSubjects(new Map(Object.entries((d as { subjects?: Record<string, string> }).subjects ?? {})));
      })
      .catch((e) => setError(String(e)));
    Promise.all([read('i18n/kanji-grades.json'), read('i18n/proper-nouns.json')])
      .then(([g, n]) =>
        setKanji({
          table: kanjiGradeTable((g as { byGrade: Record<string, string> }).byGrade),
          names: new Set((n as { names: string[] }).names),
        }),
      )
      .catch((e) => setError(String(e)));
  }, []);

  useEffect(() => {
    if (!file) return;
    read(file)
      .then((raw) => {
        const arr = Array.isArray(raw) ? raw : [];
        setItems(arr.filter((q) => questionBaseSchema.safeParse(q).success) as QuestionBase[]);
        if (arr[0]) setJson(JSON.stringify(arr[0], null, 2));
      })
      .catch((e) => setError(String(e)));
  }, [file]);

  const run = async (text = json) => {
    // 前の 問題が まだ 出ていたら 中断して、あとから 来た 結果は 見ない
    abort.current?.abort();
    const id = ++runId.current;
    setRunning(false);
    setError('');
    setResult(null);
    let q: QuestionBase;
    try {
      const parsed = questionBaseSchema.safeParse(JSON.parse(text));
      if (!parsed.success)
        throw new Error(parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('\n'));
      q = parsed.data as QuestionBase;
    } catch (e) {
      setError(`JSON エラー: ${(e as Error).message}`);
      return;
    }
    const r = getRenderer(q.type);
    if (!r) {
      setError(
        `未登録の問題タイプ "${q.type}"。登録済み: ${allRenderers()
          .map((x) => x.type)
          .join(', ')}`,
      );
      return;
    }
    const p = r.schema.safeParse(q.payload);
    if (!p.success) {
      setError(
        `payload エラー (${q.type}):\n` +
          p.error.issues.map((i) => `  ${i.path.join('.')}: ${i.message}`).join('\n'),
      );
      return;
    }
    const container = document.createElement('div');
    stage.current!.replaceChildren(container);
    const ctl = new AbortController();
    abort.current = ctl;
    setRunning(true);
    const started = performance.now();
    const res = await r.mount({
      container,
      question: { ...q, payload: p.data },
      grade,
      assets,
      speak,
      timeLimitMs: timeLimit * 1000,
      signal: ctl.signal,
    });
    if (id !== runId.current) return;
    setRunning(false);
    setResult({ ...res, timeMs: res.timeMs || Math.round(performance.now() - started) });
  };

  /** いちらんの 行を おした：JSON に 入れて、ステージで 出す（URL も ?q=<id> に） */
  const pick = (e: QuestionEntry) => {
    const text = JSON.stringify(e.raw, null, 2);
    setSelected(e.key);
    setJson(text);
    if (e.q) history.replaceState(null, '', `?q=${encodeURIComponent(e.q.id)}`);
    stage.current?.scrollIntoView({ block: 'nearest' });
    void run(text);
  };

  // ?q=<問題 id> で ひらく（リロード・共有しても 同じ 問題が 出る）
  useEffect(() => {
    if (opened.current || !entries.length || !kanji) return;
    opened.current = true;
    const id = new URLSearchParams(location.search).get('q');
    const e = id ? entries.find((x) => x.q?.id === id) : undefined;
    if (e) pick(e);
  }, [entries, kanji]);

  return (
    <div class="pg">
      <div class="pg-side">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 8px;">
          <h2 style="margin:0">Question Playground</h2>
          <a href={`${base}/editor.html`} style="font-size:13px; font-weight:bold; color:#4f46e5; text-decoration:none; background:#e0e7ff; padding:4px 8px; border-radius:4px;">
            ✏️ Webエディタ＆共同編集
          </a>
        </div>
        <div class="pg-row">
          <label>学年</label>
          <select
            value={grade}
            onChange={(e) => setGrade(Number((e.target as HTMLSelectElement).value) as Grade)}
          >
            {[1, 2, 3, 4, 5, 6].map((g) => (
              <option value={g}>小{g}</option>
            ))}
          </select>
          <label>制限(秒)</label>
          <input
            type="number"
            value={timeLimit}
            min={3}
            max={120}
            onInput={(e) => setTimeLimit(Number((e.target as HTMLInputElement).value))}
          />
        </div>
        <label>問題ファイル</label>
        <select id="pg-file" value={file} onChange={(e) => setFile((e.target as HTMLSelectElement).value)}>
          <option value="">-- content/questions から選ぶ --</option>
          {files.map((f) => (
            <option value={f}>{f}</option>
          ))}
        </select>
        {items.length > 0 && (
          <select
            onChange={(e) =>
              setJson(JSON.stringify(items[Number((e.target as HTMLSelectElement).value)], null, 2))
            }
          >
            {items.map((q, i) => (
              <option value={i}>
                {q.id} ({q.type})
              </option>
            ))}
          </select>
        )}
        <label>問題 JSON（直接編集して試せます）</label>
        <textarea
          id="pg-json"
          value={json}
          onInput={(e) => setJson((e.target as HTMLTextAreaElement).value)}
          spellcheck={false}
        />
        <div class="pg-row">
          <button class="pg-run" onClick={() => void run()} disabled={running}>
            ▶ 表示
          </button>
          <button onClick={() => abort.current?.abort()} disabled={!running}>
            中断
          </button>
          <span style="font-size:12px">
            登録タイプ:{' '}
            {allRenderers()
              .map((r) => r.type)
              .join(', ')}
          </span>
        </div>
        {error && <pre class="pg-warn">{error}</pre>}
        <label>QuestionResult</label>
        <pre class="pg-result">{result ? JSON.stringify(result, null, 2) : '(まだ結果はありません)'}</pre>
      </div>
      <div class="pg-main">
        <div class="pg-stage" ref={stage} />
        <QuestionList
          entries={entries}
          units={units}
          subjects={subjects}
          selected={selected}
          onPick={pick}
          onReload={() => void loadAll()}
          imageUrl={assets.image}
        />
      </div>
    </div>
  );
}

render(<App />, document.getElementById('playground')!);
