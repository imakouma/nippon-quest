/**
 * 問題いちらん（開発用。Question Playground の ステージの 下に 出す）。
 * content/questions の 問題を ぜんぶ 表にして、教科・学年・タイプ・単元・ことばで しぼりこむ。
 * 行を おすと、その問題を 上の ステージで 出す。スキーマに 合わない 問題は 赤く 出る。
 * 問題タイプごとの 分岐は しない（prompt・choices / words / cards・answer という よくある 形から 拾う）。
 */
import { useMemo, useState } from 'preact/hooks';
import type { QuestionCatalog } from '../core/content/manifest';
import type { QuestionBase } from '../questions/contracts';
import { PICTURE_KEYS, pictureUrl, type PictureKey } from '../questions/renderers/shared/pictures';
import { tOpt } from '../ui/i18n';
import { RubyLabel } from '../ui/RubyLabel';
import { stripRuby } from '../ui/ruby';
import { QuestionTree } from './QuestionTree';

export interface QuestionEntry {
  /** "<ファイル>#<何番目>" */
  key: string;
  file: string;
  index: number;
  /** ファイルに 書いてある まま（$schema も そのまま） */
  raw: unknown;
  /** 共通部分（QuestionBase）が 読めたとき */
  q: QuestionBase | null;
  /** スキーマに 合わない・未登録タイプ・id の 重複 など */
  problem: string | null;
}

export interface QuestionListProps {
  entries: QuestionEntry[];
  /** 単元コード → 名前（units.json） */
  units: ReadonlyMap<string, string>;
  /** 教科コード → 名前（i18n の subjects） */
  subjects: ReadonlyMap<string, string>;
  catalog?: QuestionCatalog;
  selected: string | null;
  onPick: (e: QuestionEntry) => void;
  onReload: () => void;
  imageUrl: (path: string) => string;
}

type Facet = 'subject' | 'grade' | 'type' | 'unit';
const FACETS: Facet[] = ['subject', 'grade', 'type', 'unit'];

interface Option {
  text: string;
  image?: string;
  correct: boolean;
}
interface Summary {
  prompt?: string;
  picture?: PictureKey;
  image?: string;
  options: Option[];
}

const SUBJECT_ORDER = ['kokugo', 'sansu', 'rika', 'shakai', 'seikatsu', 'eigo'];
const PICTURES = new Set<string>(PICTURE_KEYS);
const str = (v: unknown) => (typeof v === 'string' ? v : undefined);
const isSample = (e: QuestionEntry) => e.file.startsWith('questions/_samples/');
const pgText = (key: string) => stripRuby(tOpt(`tools.playground.${key}`) ?? '', 'kanji');

/** 表に 出す 中身。タイプを 知らなくても、よくある 形から 拾う */
function summarize(q: QuestionBase): Summary {
  const p = (q.payload ?? {}) as Record<string, unknown>;
  const list = [p.choices, p.words, p.cards].find(Array.isArray) as Record<string, unknown>[] | undefined;
  const picture = str(p.picture);
  return {
    prompt: str(p.prompt),
    picture: picture && PICTURES.has(picture) ? (picture as PictureKey) : undefined,
    image: str(p.promptImage) ?? str(p.image),
    options: (list ?? []).map((o) => ({
      text: str(o.text) ?? str(o.id) ?? '?',
      image: str(o.image),
      correct: o.id !== undefined && o.id === p.answer,
    })),
  };
}

/** さがす ときに 見る 文字（ルビは 漢字と よみの 両方） */
function haystack(e: QuestionEntry): string {
  const q = e.q;
  if (!q) return `${e.file} ${e.problem ?? ''}`.toLowerCase();
  const s = summarize(q);
  const texts = [s.prompt, ...s.options.map((o) => o.text), q.explanation].filter((t): t is string => !!t);
  return [
    q.id,
    q.unit,
    q.type,
    ...(q.tags ?? []),
    s.picture ?? '',
    ...texts.flatMap((t) => [stripRuby(t, 'kanji'), stripRuby(t, 'kana')]),
  ]
    .join('\n')
    .toLowerCase();
}

export function QuestionList({
  entries,
  units,
  subjects,
  catalog,
  selected,
  onPick,
  onReload,
  imageUrl,
}: QuestionListProps) {
  const [f, setF] = useState<Record<Facet, string>>({ subject: '', grade: '', type: '', unit: '' });
  const [text, setText] = useState('');
  const [samples, setSamples] = useState(false);
  const [onlyBad, setOnlyBad] = useState(false);
  const [scopeFile, setScopeFile] = useState<string | null>(null);
  const search = useMemo(() => new Map(entries.map((e) => [e.key, haystack(e)])), [entries]);

  const pool = entries.filter((e) => (samples || !isSample(e)) && (!scopeFile || e.file === scopeFile));
  const valueOf = (e: QuestionEntry, k: Facet) => (e.q ? String(e.q[k]) : '');
  const needle = text.trim().toLowerCase();
  /** skip の しぼりこみ だけ 外して あてはまるか（えらぶ ところの 件数に つかう） */
  const match = (e: QuestionEntry, skip?: Facet) =>
    (!onlyBad || !!e.problem) &&
    FACETS.every((k) => k === skip || !f[k] || valueOf(e, k) === f[k]) &&
    (!needle || (search.get(e.key) ?? '').includes(needle));
  const shown = pool.filter((e) => match(e));
  const visible = shown.slice(0, 200);
  const bad = pool.filter((e) => e.problem).length;

  const facet = (
    k: Facet,
    all: string,
    label: (v: string) => string,
    order: (a: string, b: string) => number,
  ) => {
    const n = new Map<string, number>();
    for (const e of pool) if (e.q && match(e, k)) n.set(valueOf(e, k), (n.get(valueOf(e, k)) ?? 0) + 1);
    // えらんで いる ものは 0 件でも 出す（外せなく ならないように）
    if (f[k] && !n.has(f[k])) n.set(f[k], 0);
    return (
      <select
        id={`pg-f-${k}`}
        aria-label={all}
        value={f[k]}
        onChange={(ev) => setF({ ...f, [k]: (ev.target as HTMLSelectElement).value })}
      >
        <option value="">{all}</option>
        {[...n]
          .sort(([a], [b]) => order(a, b))
          .map(([v, c]) => (
            <option value={v}>
              {label(v)}（{c}）
            </option>
          ))}
      </select>
    );
  };
  const byText = (a: string, b: string) => a.localeCompare(b);

  return (
    <nav class="pg-list" aria-label={pgText('find')}>
      <div class="pg-list-head">
        <div>
          <p class="pg-section-label">{pgText('library')}</p>
          <h2>{pgText('find')}</h2>
        </div>
        <button type="button" class="pg-reload" onClick={onReload}>
          ↻ {pgText('reload')}
        </button>
      </div>

      <div class="pg-filters">
        <label class="pg-search" for="pg-f-text">
          <span>{pgText('searchLabel')}</span>
          <input
            id="pg-f-text"
            type="search"
            placeholder={pgText('searchPlaceholder')}
            value={text}
            onInput={(ev) => setText((ev.target as HTMLInputElement).value)}
          />
        </label>
        <div class="pg-filter-grid">
          {facet(
            'subject',
            pgText('allSubjects'),
            (v) => subjects.get(v) ?? v,
            (a, b) => SUBJECT_ORDER.indexOf(a) - SUBJECT_ORDER.indexOf(b),
          )}
          {facet(
            'grade',
            pgText('allGrades'),
            (v) => `${pgText('gradePrefix')}${v}`,
            (a, b) => Number(a) - Number(b),
          )}
          {facet('type', pgText('allTypes'), (v) => v, byText)}
          {facet('unit', pgText('allUnits'), (v) => `${stripRuby(units.get(v) ?? '', 'kanji')} ${v}`, byText)}
        </div>
        <div class="pg-filter-options">
          <label>
            <input
              type="checkbox"
              checked={samples}
              onChange={(ev) => setSamples((ev.target as HTMLInputElement).checked)}
            />
            {pgText('showSamples')}
          </label>
          <label>
            <input
              type="checkbox"
              checked={onlyBad}
              onChange={(ev) => setOnlyBad((ev.target as HTMLInputElement).checked)}
            />
            {pgText('onlyErrors')}
          </label>
        </div>
      </div>

      <div class="pg-browser">
        {catalog && (
          <QuestionTree
            catalog={catalog}
            units={units}
            subjects={subjects}
            selectedFile={scopeFile}
            onSelectFile={setScopeFile}
          />
        )}
        <div class="pg-results">
          <div class="pg-results-head">
            <strong>{pgText('searchResults')}</strong>
            <span class="pg-count">
              {shown.length}
              {pgText('questionSuffix')} / {pool.length}
              {pgText('questionSuffix')}
              {bad > 0 && (
                <b class="pg-err">
                  {' '}
                  · {pgText('error')} {bad}
                </b>
              )}
            </span>
          </div>
          <div class="pg-question-list" role="list">
            {visible.map((e) => (
              <Row
                key={e.key}
                e={e}
                unitName={e.q ? units.get(e.q.unit) : undefined}
                subjectName={e.q ? subjects.get(e.q.subject) : undefined}
                selected={selected === e.key}
                onPick={onPick}
                imageUrl={imageUrl}
              />
            ))}
          </div>
          {shown.length === 0 && <p class="pg-empty">{pgText('noMatches')}</p>}
          {shown.length > visible.length && <p class="pg-empty">{pgText('first200')}</p>}
        </div>
      </div>
    </nav>
  );
}

interface RowProps {
  e: QuestionEntry;
  unitName?: string;
  subjectName?: string;
  selected: boolean;
  onPick: (e: QuestionEntry) => void;
  imageUrl: (path: string) => string;
}

function Row({ e, unitName, subjectName, selected, onPick, imageUrl }: RowProps) {
  const q = e.q;
  const s = q ? summarize(q) : null;
  const cls = [selected && 'pg-sel', e.problem && 'pg-bad'].filter(Boolean).join(' ');
  return (
    <div role="listitem">
      <button
        type="button"
        class={`pg-question-row ${cls}`}
        title={e.file}
        aria-current={selected ? 'true' : undefined}
        data-question-type={q?.type}
        onClick={() => onPick(e)}
      >
        <span class="pg-mark" aria-label={e.problem ? pgText('error') : pgText('verified')}>
          {e.problem ? '!' : '✓'}
        </span>
        {(s?.picture || s?.image) && (
          <span class="pg-question-thumb">
            {s.picture && <img class="pg-thumb" src={pictureUrl(s.picture)} alt={s.picture} />}
            {s.image && <Thumb src={imageUrl(s.image)} />}
          </span>
        )}
        <span class="pg-question-copy">
          <strong>
            {s?.prompt ? (
              <RubyLabel text={s.prompt} />
            ) : unitName ? (
              <RubyLabel text={unitName} />
            ) : (
              (q?.id ?? `${e.file}[${e.index}]`)
            )}
          </strong>
          <span class="pg-question-facts">
            {q && `${subjectName ?? q.subject} · ${pgText('gradePrefix')}${q.grade} · ${q.type}`}
          </span>
          <code class="pg-id">{q?.id ?? `${e.file}[${e.index}]`}</code>
          {s && s.options.length > 0 && (
            <span class="pg-question-options">
              {s.options.slice(0, 4).map((option) => (
                <span class={option.correct ? 'pg-option-correct' : undefined}>
                  <RubyLabel text={option.text} />
                </span>
              ))}
            </span>
          )}
          {e.problem && <span class="pg-err">{e.problem}</span>}
        </span>
        <span class="pg-question-arrow" aria-hidden="true">
          ›
        </span>
      </button>
      {selected && q?.explanation && (
        <div class="pg-question-explanation">
          <span>{pgText('explanation')}</span>
          <RubyLabel text={q.explanation} />
        </div>
      )}
    </div>
  );
}

/** まだ 置いていない 画像は かくす（本番の絵は あとから 置く） */
function Thumb({ src }: { src: string }) {
  const [ok, setOk] = useState(true);
  return ok ? <img class="pg-thumb" src={src} alt="" onError={() => setOk(false)} /> : null;
}
