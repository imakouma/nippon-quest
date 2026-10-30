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
import { fetchReader, parseContentManifest, type QuestionCatalog } from '../core/content/loader';
import { setDictionary, tOpt, type I18nDict } from '../ui/i18n';
import { createSpeaker } from '../ui/overlay';
import { kanjiGradeTable, setKanjiLevel, stripRuby, type KanjiGradeTable } from '../ui/ruby';
import { RubyLabel } from '../ui/RubyLabel';
import { EditorQuestionForm } from './editorQuestionForm';
import { QuestionList, type QuestionEntry } from './QuestionList';
import '../questions/renderers/shared/questions.css';
import './playground.css';

const base = import.meta.env.BASE_URL.replace(/\/$/, '');
const read = fetchReader(`${base}/content`);
const QUESTION_FILE_CONCURRENCY = 8;
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

async function readQuestionFiles(files: string[]) {
  const loaded = new Array<{ file: string; raw: unknown }>(files.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(QUESTION_FILE_CONCURRENCY, files.length) }, async () => {
      while (next < files.length) {
        const index = next++;
        const file = files[index]!;
        loaded[index] = { file, raw: await read(file) };
      }
    }),
  );
  return loaded;
}

function parseQuestion(text: string): QuestionBase | null {
  try {
    const parsed = questionBaseSchema.safeParse(JSON.parse(text));
    return parsed.success ? (parsed.data as QuestionBase) : null;
  } catch {
    return null;
  }
}

const pgText = (key: string) => stripRuby(tOpt(`tools.playground.${key}`) ?? '', 'kanji');

function resultStatus(result: QuestionResult): { key: string; label: string } {
  if (result.timedOut) return { key: 'timeout', label: pgText('statusTimeout') };
  if (result.score >= 1) return { key: 'correct', label: pgText('statusCorrect') };
  if (result.score > 0) return { key: 'partial', label: pgText('statusPartial') };
  return { key: 'review', label: pgText('statusReview') };
}

function App() {
  const [files, setFiles] = useState<string[]>([]);
  const [file, setFile] = useState('');
  const [items, setItems] = useState<QuestionBase[]>([]);
  const [entries, setEntries] = useState<QuestionEntry[]>([]);
  const [units, setUnits] = useState<ReadonlyMap<string, string>>(new Map());
  const [subjects, setSubjects] = useState<ReadonlyMap<string, string>>(new Map());
  const [catalog, setCatalog] = useState<QuestionCatalog>();
  const [kanji, setKanji] = useState<{ table: KanjiGradeTable; names: ReadonlySet<string> } | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [selectedItemId, setSelectedItemId] = useState('');
  const [json, setJson] = useState('');
  const [draft, setDraft] = useState<QuestionBase | null>(null);
  const [grade, setGrade] = useState<Grade>(3);
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
      const m = parseContentManifest(await read('manifest.json'));
      setFiles(m.questions);
      setCatalog(m.questionCatalog);
      const requestedId = new URLSearchParams(location.search).get('q');
      const directFile = requestedId ? m.questionIndex?.[requestedId] : undefined;
      if (requestedId && directFile) {
        const raw = await read(directFile);
        setEntries(toEntries([{ file: directFile, raw }]));
        setItems(
          (Array.isArray(raw) ? raw : []).filter(
            (q) => questionBaseSchema.safeParse(q).success,
          ) as QuestionBase[],
        );
        setFile(directFile);
      }
      setEntries(toEntries(await readQuestionFiles(m.questions)));
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
        const validItems = arr.filter((q) => questionBaseSchema.safeParse(q).success) as QuestionBase[];
        const requestedId = new URLSearchParams(location.search).get('q');
        const initial = validItems.find((q) => q.id === requestedId) ?? validItems[0];
        setItems(validItems);
        setSelectedItemId(initial?.id ?? '');
        if (initial) {
          setGrade(initial.grade);
          setDraft(initial);
          setJson(JSON.stringify(initial, null, 2));
        }
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
      setError(`問題データのエラー: ${(e as Error).message}`);
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
      grade: q.grade,
      assets,
      speak,
      timeLimitMs: (q.timeLimitSec ?? 20) * 1000,
      signal: ctl.signal,
    });
    if (id !== runId.current) return;
    setRunning(false);
    setResult({ ...res, timeMs: res.timeMs || Math.round(performance.now() - started) });
  };

  const replaceUrl = (questionId: string | undefined) => {
    const url = new URL(location.href);
    if (questionId) url.searchParams.set('q', questionId);
    else url.searchParams.delete('q');
    url.searchParams.delete('mode');
    history.replaceState(null, '', `${url.pathname}${url.search}`);
  };

  const updateDraft = (next: QuestionBase) => {
    setDraft(next);
    setGrade(next.grade);
    setJson(JSON.stringify(next, null, 2));
  };

  const updateDraftField = (field: keyof QuestionBase, value: unknown) => {
    if (draft) updateDraft({ ...draft, [field]: value });
  };

  const updateDraftPayload = (key: string, value: unknown) => {
    if (!draft) return;
    const payload =
      draft.payload && typeof draft.payload === 'object' ? (draft.payload as Record<string, unknown>) : {};
    updateDraft({ ...draft, payload: { ...payload, [key]: value } });
  };

  /** いちらんの 行を おした：JSON に 入れて、ステージで 出す（URL も ?q=<id> に） */
  const pick = (e: QuestionEntry) => {
    const text = JSON.stringify(e.raw, null, 2);
    setSelected(e.key);
    setFile(e.file);
    setSelectedItemId(e.q?.id ?? '');
    if (e.q) {
      setGrade(e.q.grade);
      setDraft(e.q);
    }
    setJson(text);
    if (e.q) replaceUrl(e.q.id);
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

  const question = parseQuestion(json);
  const payload = question?.payload as Record<string, unknown> | undefined;
  const prompt = typeof payload?.prompt === 'string' ? payload.prompt : undefined;
  const questionTitle = prompt ?? (question ? units.get(question.unit) : undefined) ?? question?.id;
  const subject = question ? (subjects.get(question.subject) ?? question.subject) : '';
  const status = result ? resultStatus(result) : null;

  return (
    <div class="pg">
      <header class="pg-header">
        <div>
          <h1>{pgText('title')}</h1>
        </div>
        <nav class="pg-header-actions" aria-label={pgText('pageNavigation')}>
          <a class="pg-link pg-link-secondary" href={`${base}/`}>
            ← {tOpt('ui.backToGame')}
          </a>
        </nav>
      </header>

      <main class="pg-workspace">
        <QuestionList
          entries={entries}
          units={units}
          subjects={subjects}
          catalog={catalog}
          selected={selected}
          onPick={pick}
          onReload={() => void loadAll()}
          imageUrl={assets.image}
        />

        <div class="pg-review">
          <div class="pg-preview-column">
            <section class="pg-preview" aria-label={pgText('preview')}>
              <div class="pg-preview-head">
                <div class="pg-question-heading">
                  <p class="pg-section-label">{pgText('selectedQuestion')}</p>
                  <h2>{questionTitle ? <RubyLabel text={questionTitle} /> : pgText('chooseQuestion')}</h2>
                  {question && (
                    <div class="pg-question-meta">
                      <span>{subject}</span>
                      <span>
                        {pgText('gradePrefix')}
                        {question.grade}
                      </span>
                      <span>{question.type}</span>
                      <code>{question.id}</code>
                    </div>
                  )}
                </div>
                <div class="pg-test-controls" aria-label={pgText('testSettings')}>
                  <button
                    type="button"
                    class="pg-run"
                    onClick={() => void run()}
                    disabled={running || !question}
                  >
                    {pgText('playQuestion')}
                  </button>
                  <button
                    type="button"
                    class="pg-stop"
                    onClick={() => abort.current?.abort()}
                    disabled={!running}
                  >
                    {pgText('stop')}
                  </button>
                </div>
              </div>

              {error && (
                <pre class="pg-warn" role="alert">
                  {error}
                </pre>
              )}
              <div class="pg-stage-shell">
                <div class="pg-stage" ref={stage} />
                {!question && <p class="pg-stage-empty">{pgText('stageEmpty')}</p>}
              </div>
            </section>

            <section class="pg-editor" aria-label={pgText('editPanel')}>
              <div class="pg-editor-head">
                <div>
                  <p class="pg-section-label">{pgText('selectedQuestion')}</p>
                  <h2>{pgText('editPanel')}</h2>
                </div>
                <p>{pgText('draftHelp')}</p>
              </div>
              {draft ? (
                <div class="pg-editor-form">
                  <EditorQuestionForm
                    question={draft}
                    onQuestionChange={updateDraft}
                    onFieldChange={updateDraftField}
                    onPayloadChange={updateDraftPayload}
                  />
                </div>
              ) : (
                <p class="pg-editor-empty">{pgText('chooseQuestion')}</p>
              )}
            </section>

            <section class="pg-result-summary" aria-label={pgText('testResult')}>
              <div class="pg-result-heading">
                <p class="pg-section-label">{pgText('testResult')}</p>
                {running ? (
                  <strong class="pg-result-state">{pgText('answering')}</strong>
                ) : status ? (
                  <strong class={`pg-result-state pg-result-state-${status.key}`}>{status.label}</strong>
                ) : (
                  <strong class="pg-result-state">{pgText('noResult')}</strong>
                )}
              </div>
              {result ? (
                <dl class="pg-result-metrics">
                  <div>
                    <dt>{pgText('score')}</dt>
                    <dd>{Math.round(result.score * 100)}%</dd>
                  </div>
                  <div>
                    <dt>{pgText('duration')}</dt>
                    <dd>
                      {(result.timeMs / 1000).toFixed(1)}
                      {pgText('seconds')}
                    </dd>
                  </div>
                  <div>
                    <dt>{pgText('attempts')}</dt>
                    <dd>
                      {result.attempts}
                      {pgText('times')}
                    </dd>
                  </div>
                </dl>
              ) : (
                <p class="pg-result-help">{pgText('resultHelp')}</p>
              )}
            </section>

            <details class="pg-technical">
              <summary>
                <span>{pgText('technical')}</span>
                <small>{pgText('technicalHelp')}</small>
              </summary>
              <div class="pg-technical-body">
                <div class="pg-technical-grid">
                  <label for="pg-file">
                    {pgText('questionFile')}
                    <select
                      id="pg-file"
                      value={file}
                      onChange={(e) => setFile((e.target as HTMLSelectElement).value)}
                    >
                      <option value="">{pgText('chooseFile')}</option>
                      {files.map((f) => (
                        <option value={f}>{f}</option>
                      ))}
                    </select>
                  </label>
                  {items.length > 0 && (
                    <label for="pg-question">
                      {pgText('questionInFile')}
                      <select
                        id="pg-question"
                        value={String(
                          Math.max(
                            0,
                            items.findIndex((item) => item.id === selectedItemId),
                          ),
                        )}
                        onChange={(e) => {
                          const item = items[Number((e.target as HTMLSelectElement).value)];
                          if (!item) return;
                          setSelectedItemId(item.id);
                          setGrade(item.grade);
                          setDraft(item);
                          setJson(JSON.stringify(item, null, 2));
                        }}
                      >
                        {items.map((q, i) => (
                          <option value={i}>
                            {q.id} ({q.type})
                          </option>
                        ))}
                      </select>
                    </label>
                  )}
                </div>
                <div class="pg-technical-actions">
                  <button type="button" onClick={() => void run()} disabled={running || !question}>
                    {pgText('tryQuestion')}
                  </button>
                  <span>
                    {pgText('registeredTypes')}：
                    {allRenderers()
                      .map((r) => r.type)
                      .join(', ')}
                  </span>
                </div>
                <div>
                  <span class="pg-technical-label">QuestionResult</span>
                  <pre class="pg-result">
                    {result ? JSON.stringify(result, null, 2) : `(${pgText('noResult')})`}
                  </pre>
                </div>
              </div>
            </details>
          </div>
        </div>
      </main>
    </div>
  );
}

render(<App />, document.getElementById('playground')!);
