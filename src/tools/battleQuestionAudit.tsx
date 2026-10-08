/**
 * バトル問題枠の全件レイアウト監査（開発専用）。
 * QuestionFrame と本番のレンダラーをそのまま使い、content/manifest.json の全問題を順番に描画する。
 */
import { render } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import { questionBaseSchema, type QuestionBase } from '../questions/contracts';
import { getRenderer } from '../questions/renderers/registry';
import { fetchReader, parseContentManifest } from '../core/content/loader';
import { QuestionFrame } from '../ui/QuestionFrame';
import { setDictionary, type I18nDict } from '../ui/i18n';
import { kanjiGradeTable, setKanjiLevel } from '../ui/ruby';
import { createSpeaker } from '../ui/overlay';
import '../ui/app.css';
import '../questions/renderers/shared/questions.css';
import './battleQuestionAudit.css';

const base = import.meta.env.BASE_URL.replace(/\/$/, '');
const read = fetchReader(`${base}/content`);
const assets = {
  image: (path: string) => `${base}/assets/${path}`,
  audio: (path: string) => `${base}/assets/${path}`,
};
const speak = createSpeaker();
const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

interface AuditFailure {
  id: string;
  type: string;
  reason: string;
}

function inspectQuestion(host: HTMLElement): string[] {
  const hostRect = (host.parentElement ?? host).getBoundingClientRect();
  const errors: string[] = [];
  const isInside = (rect: DOMRect) =>
    rect.left >= hostRect.left - 1 &&
    rect.right <= hostRect.right + 1 &&
    rect.top >= hostRect.top - 1 &&
    rect.bottom <= hostRect.bottom + 1;
  const isReachableByScroll = (element: HTMLElement) => {
    for (let parent = element.parentElement; parent && parent !== host; parent = parent.parentElement) {
      const style = getComputedStyle(parent);
      const scrolls =
        ((style.overflowY === 'auto' || style.overflowY === 'scroll') &&
          parent.scrollHeight > parent.clientHeight) ||
        ((style.overflowX === 'auto' || style.overflowX === 'scroll') &&
          parent.scrollWidth > parent.clientWidth);
      if (scrolls && isInside(parent.getBoundingClientRect())) return true;
    }
    return false;
  };
  const question = host.querySelector<HTMLElement>('.nq-q');
  if (!question) return ['問題のルートが描画されていません'];
  if (!isInside(question.getBoundingClientRect())) errors.push('問題のルートが枠からはみ出しています');

  for (const element of host.querySelectorAll<HTMLElement>('button, input, select, textarea, img, canvas')) {
    const style = getComputedStyle(element);
    if (style.display === 'none' || style.visibility === 'hidden') continue;
    const rect = element.getBoundingClientRect();
    const pendingImage =
      element instanceof HTMLImageElement && (!element.complete || element.naturalWidth === 0);
    if (!pendingImage && (rect.width < 24 || rect.height < 24))
      errors.push(`${element.tagName.toLowerCase()} の操作・表示領域が小さすぎます`);
    if (!isInside(rect) && !isReachableByScroll(element))
      errors.push(`${element.tagName.toLowerCase()} が問題枠からはみ出しています`);
  }
  return [...new Set(errors)];
}

function parseQuestions(files: { file: string; raw: unknown }[]): QuestionBase[] {
  const questions: QuestionBase[] = [];
  for (const { file, raw } of files) {
    if (!Array.isArray(raw)) throw new Error(`${file} が配列ではありません`);
    for (const item of raw) {
      const parsed = questionBaseSchema.safeParse(item);
      if (!parsed.success) throw new Error(`${file}: 問題の形式が不正です`);
      questions.push(parsed.data as QuestionBase);
    }
  }
  return questions;
}

function AuditApp() {
  const host = useRef(document.createElement('div'));
  const [title, setTitle] = useState('もんだいを よみこみ中');
  const [status, setStatus] = useState('loading');
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [failures, setFailures] = useState<AuditFailure[]>([]);

  useEffect(() => {
    let disposed = false;
    let abort: AbortController | null = null;
    const run = async () => {
      try {
        const manifest = parseContentManifest(await read('manifest.json'));
        const dictionary = (await read('i18n/ja.json')) as I18nDict;
        const [grades, names] = await Promise.all([
          read('i18n/kanji-grades.json'),
          read('i18n/proper-nouns.json'),
        ]);
        setDictionary(dictionary);
        setKanjiLevel({
          grade: 3,
          table: kanjiGradeTable((grades as { byGrade: Record<string, string> }).byGrade),
          names: new Set((names as { names: string[] }).names),
        });
        const all = parseQuestions(
          await Promise.all(manifest.questions.map(async (file) => ({ file, raw: await read(file) }))),
        );
        const requested = new URLSearchParams(location.search).get('q');
        const questions = requested ? all.filter((question) => question.id === requested) : all;
        if (requested && questions.length !== 1) throw new Error(`問題IDが見つかりません: ${requested}`);
        setProgress({ done: 0, total: questions.length });
        const found: AuditFailure[] = [];

        for (let index = 0; index < questions.length && !disposed; index += 1) {
          const question = questions[index]!;
          const renderer = getRenderer(question.type);
          if (!renderer) {
            found.push({ id: question.id, type: question.type, reason: '未登録の問題タイプです' });
            continue;
          }
          const payload = renderer.schema.safeParse(question.payload);
          if (!payload.success) {
            found.push({ id: question.id, type: question.type, reason: 'payloadの形式が不正です' });
            continue;
          }
          setTitle(question.unit);
          host.current.replaceChildren();
          const container = document.createElement('div');
          host.current.appendChild(container);
          abort = new AbortController();
          // 解答を待つPromiseは監査では待たない。AbortとPreactのunmountで副作用を必ず片付ける。
          void renderer
            .mount({
              container,
              question: { ...question, payload: payload.data },
              grade: question.grade,
              assets,
              speak,
              timeLimitMs: (question.timeLimitSec ?? 20) * 1000,
              signal: abort.signal,
            })
            .catch((error: unknown) => console.error('question mount failed', question.id, error));
          await nextFrame();
          if (!disposed) {
            for (const reason of inspectQuestion(host.current))
              found.push({ id: question.id, type: question.type, reason });
            setProgress({ done: index + 1, total: questions.length });
          }
          if (!requested) {
            abort.abort();
            renderer.unmount?.();
            render(null, container);
            host.current.replaceChildren();
          }
        }
        if (!disposed) {
          setFailures(found);
          setStatus(found.length ? 'failed' : 'complete');
        }
      } catch (error) {
        if (!disposed) {
          setFailures([{ id: 'audit', type: 'audit', reason: String(error) }]);
          setStatus('failed');
        }
      }
    };
    void run();
    return () => {
      disposed = true;
      abort?.abort();
      host.current.replaceChildren();
    };
  }, []);

  return (
    <main class="nq-audit" data-audit-status={status}>
      <h1>バトル問題UI 全件監査</h1>
      <p class="nq-audit-progress" data-audit-progress={`${progress.done}/${progress.total}`}>
        {progress.done} / {progress.total} 問を確認中
      </p>
      <div class="nq-audit-stage">
        {progress.total > 0 && (
          <QuestionFrame
            host={host.current}
            title={title}
            subject="sansu"
            hint="もんだいの ひょうじを かくにん"
          />
        )}
      </div>
      <p class={`nq-audit-result nq-audit-result-${status}`} data-audit-failure-count={failures.length}>
        {status === 'complete'
          ? 'すべての問題でレイアウト異常はありません。'
          : status === 'failed'
            ? `${failures.length}件の異常があります。`
            : '確認を開始しています。'}
      </p>
      {failures.length > 0 && (
        <ol class="nq-audit-failures">
          {failures.map((failure, index) => (
            <li key={`${failure.id}-${failure.reason}-${index}`}>
              <code>{failure.id}</code>（{failure.type}）: {failure.reason}
            </li>
          ))}
        </ol>
      )}
    </main>
  );
}

render(<AuditApp />, document.getElementById('app')!);
