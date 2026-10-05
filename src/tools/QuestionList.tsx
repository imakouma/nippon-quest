/**
 * 問題いちらん（開発用。Question Playground の ステージの 下に 出す）。
 * content/questions の 問題を ぜんぶ 表にして、教科・学年・タイプ・単元・ことばで しぼりこむ。
 * 行を おすと、その問題を 上の ステージで 出す。スキーマに 合わない 問題は 赤く 出る。
 * 問題タイプごとの 分岐は しない（prompt・choices / words / cards・answer という よくある 形から 拾う）。
 */
import { useMemo, useState } from 'preact/hooks';
import type { QuestionBase } from '../questions/contracts';
import { PICTURE_KEYS, pictureUrl, type PictureKey } from '../questions/renderers/shared/pictures';
import { RubyLabel } from '../ui/RubyLabel';
import { stripRuby } from '../ui/ruby';

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
  selected,
  onPick,
  onReload,
  imageUrl,
}: QuestionListProps) {
  const [f, setF] = useState<Record<Facet, string>>({ subject: '', grade: '', type: '', unit: '' });
  const [text, setText] = useState('');
  const [samples, setSamples] = useState(false);
  const [onlyBad, setOnlyBad] = useState(false);
  const search = useMemo(() => new Map(entries.map((e) => [e.key, haystack(e)])), [entries]);

  const pool = entries.filter((e) => samples || !isSample(e));
  const valueOf = (e: QuestionEntry, k: Facet) => (e.q ? String(e.q[k]) : '');
  const needle = text.trim().toLowerCase();
  /** skip の しぼりこみ だけ 外して あてはまるか（えらぶ ところの 件数に つかう） */
  const match = (e: QuestionEntry, skip?: Facet) =>
    (!onlyBad || !!e.problem) &&
    FACETS.every((k) => k === skip || !f[k] || valueOf(e, k) === f[k]) &&
    (!needle || (search.get(e.key) ?? '').includes(needle));
  const shown = pool.filter((e) => match(e));
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
    <section class="pg-list">
      <div class="pg-filters">
        <strong>問題いちらん</strong>
        {facet(
          'subject',
          '教科：すべて',
          (v) => subjects.get(v) ?? v,
          (a, b) => SUBJECT_ORDER.indexOf(a) - SUBJECT_ORDER.indexOf(b),
        )}
        {facet(
          'grade',
          '学年：すべて',
          (v) => `小${v}`,
          (a, b) => Number(a) - Number(b),
        )}
        {facet('type', 'タイプ：すべて', (v) => v, byText)}
        {facet('unit', '単元：すべて', (v) => `${stripRuby(units.get(v) ?? '', 'kanji')} ${v}`, byText)}
        <input
          id="pg-f-text"
          type="search"
          placeholder="id・問題文・選択肢・解説で さがす"
          value={text}
          onInput={(ev) => setText((ev.target as HTMLInputElement).value)}
        />
        <label>
          <input
            type="checkbox"
            checked={samples}
            onChange={(ev) => setSamples((ev.target as HTMLInputElement).checked)}
          />
          _samples も
        </label>
        <label>
          <input
            type="checkbox"
            checked={onlyBad}
            onChange={(ev) => setOnlyBad((ev.target as HTMLInputElement).checked)}
          />
          エラーだけ
        </label>
        <span class="pg-count">
          {shown.length} もん（ぜんぶで {pool.length}）{bad > 0 && <b class="pg-err"> ⚠ エラー {bad}</b>}
        </span>
        <button type="button" onClick={onReload}>
          ↻ よみなおす
        </button>
      </div>
      <table class="pg-table">
        <thead>
          <tr>
            <th />
            <th>id</th>
            <th>教科・学年</th>
            <th>単元</th>
            <th>タイプ</th>
            <th>問題</th>
            <th>選択肢（緑が正解）</th>
            <th>解説</th>
          </tr>
        </thead>
        <tbody>
          {shown.map((e) => (
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
        </tbody>
      </table>
      {shown.length === 0 && <p class="pg-empty">あてはまる 問題が ありません</p>}
    </section>
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
    <tr class={cls} title={e.file} onClick={() => onPick(e)}>
      <td class="pg-mark">{e.problem ? '⚠' : '✓'}</td>
      <td class="pg-id">{q?.id ?? `${e.file}[${e.index}]`}</td>
      <td class="pg-nowrap">{q && `${subjectName ?? q.subject} 小${q.grade}`}</td>
      <td>
        {unitName ? <RubyLabel text={unitName} /> : q?.unit}
        <div class="pg-sub">
          {q?.unit}
          {q?.tags?.map((t) => (
            <span class="pg-tag">{t}</span>
          ))}
        </div>
      </td>
      <td class="pg-nowrap">{q?.type}</td>
      <td>
        {s?.picture && <img class="pg-thumb" src={pictureUrl(s.picture)} alt={s.picture} />}
        {s?.image && <Thumb src={imageUrl(s.image)} />}
        {s?.prompt && <RubyLabel text={s.prompt} />}
        {s && !s.prompt && !s.picture && s.options.length === 0 && (
          <code class="pg-sub">{JSON.stringify(q?.payload).slice(0, 120)}</code>
        )}
        {e.problem && <div class="pg-err">{e.problem}</div>}
      </td>
      <td>
        {s?.options.map((o) => (
          <span class={`pg-opt${o.correct ? ' pg-opt-ok' : ''}`}>
            {o.image && <Thumb src={imageUrl(o.image)} />}
            <RubyLabel text={o.text} />
          </span>
        ))}
      </td>
      <td class="pg-exp">{q?.explanation && <RubyLabel text={q.explanation} />}</td>
    </tr>
  );
}

/** まだ 置いていない 画像は かくす（本番の絵は あとから 置く） */
function Thumb({ src }: { src: string }) {
  const [ok, setOk] = useState(true);
  return ok ? <img class="pg-thumb" src={src} alt="" onError={() => setOk(false)} /> : null;
}
