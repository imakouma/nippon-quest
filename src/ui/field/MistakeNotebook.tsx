import { useEffect, useRef, useState } from 'preact/hooks';
import type { TargetedMouseEvent } from 'preact';
import type { ContentIndex } from '../../core/content/loader';
import {
  availableReviewCards,
  reviewCardExchangeRewards,
  reviewStampRewards,
} from '../../core/progression/reviewStamps';
import type { GameState } from '../../core/state/schema';
import type { QuestionBank } from '../../questions/engine/bank';
import type { QuestionBase } from '../../questions/contracts';
import { QuestionFrame } from '../QuestionFrame';
import { RubyLabel } from '../RubyLabel';
import { t } from '../i18n';
import './mistakeNotebook.css';

const subjects = ['kokugo', 'sansu', 'rika', 'shakai', 'seikatsu', 'eigo'] as const;
const doorColors = ['#435f99', '#865132', '#366747', '#704c78', '#437063', '#8a4658'];
const doorIcons = ['📖', '🧮', '🔍', '🗺️', '🌱', '🔤'];
const icons = ['▤', '＋', '◎', '◇', '♧', 'Aa'];
const inks = ['#344e8d', '#824921', '#2d6543', '#6c4678', '#2d625e', '#89394f'];
const dayFormat = new Intl.DateTimeFormat('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' });
const dateKey = (at: number) => dayFormat.format(at);
const label = (key: string) => t(`field.notebook.${key}`);
const prompt = (q: QuestionBase) => {
  const value = (q.payload as { prompt?: unknown }).prompt;
  return typeof value === 'string' && value ? value : t(`subjects.${q.subject}`);
};
type Stamp = NonNullable<GameState['learning']['reviewStamps']>[number];
type Props = {
  content: ContentIndex;
  bank: QuestionBank;
  getGame: () => GameState;
  onBack: () => void;
  onClose: () => void;
  onReview: (id: string, replay: boolean, host: HTMLElement, signal: AbortSignal) => Promise<boolean>;
  onStamp: (id: string, x: number, y: number) => void;
};
type Screen = 'home' | 'subjects' | 'list' | 'question' | 'press' | 'card' | 'detail' | 'exchange';
const cards = (stamps: Stamp[]) => Math.floor(stamps.length / 12);
function Ink({ stamp, q }: { stamp: Stamp; q?: QuestionBase }) {
  const i = q ? subjects.indexOf(q.subject) : -1;
  return (
    <span
      class="nqn-ink"
      style={{
        color: inks[i] ?? '#724432',
        transform: `rotate(${((stamp.seed & 31) / 31) * 22 - 11}deg)`,
        maskImage: `linear-gradient(${(((stamp.seed >> 5) & 127) * 360) / 128}deg,#000 25%,rgb(0 0 0 / ${0.6 + (stamp.seed >> 12) / 65}) 47%,#000 70%)`,
      }}
    >
      <i aria-hidden="true">{icons[i] ?? '✓'}</i>
      <b>
        <RubyLabel text={q ? t(`subjects.${q.subject}`) : label('stamp')} />
      </b>
      <time>{dateKey(stamp.at)}</time>
    </span>
  );
}

export function MistakeNotebook(p: Props) {
  const [screen, setScreen] = useState<Screen>('home');
  const [subject, setSubject] = useState<QuestionBase['subject']>('kokugo');
  const [date, setDate] = useState('');
  const [month, setMonth] = useState('');
  const [card, setCard] = useState(0);
  const [detail, setDetail] = useState<Stamp>();
  const [question, setQuestion] = useState<QuestionBase>();
  const [result, setResult] = useState<boolean | null>(null);
  const [pressed, setPressed] = useState<Stamp>();
  const [stampSlot, setStampSlot] = useState(0);
  const ctrl = useRef<AbortController>();
  const origin = useRef<Screen>('home');
  const dialog = useRef<HTMLDivElement>(null);
  const [host] = useState(() => document.createElement('div'));
  const game = p.getGame();
  const stamps = game.learning.reviewStamps ?? [];
  const pending = game.learning.pendingReviewStamps?.[0];
  const attempts = new Map<string, number>();
  for (const a of game.learning.attempts)
    if (a.score < 1) attempts.set(a.questionId, Math.max(a.answeredAt, attempts.get(a.questionId) ?? 0));
  const mistakes = game.learning.mistakes
    .flatMap((id) => {
      const q = p.bank.get(id);
      return q ? [{ q, at: game.learning.mistakeDates?.[id] ?? attempts.get(id) ?? 0 }] : [];
    })
    .sort((a, b) => b.at - a.at);
  const active = game.party.owned.find((m) => m.uid === game.party.activeUid);
  const starter =
    game.party.owned.find((m) =>
      ['aomori-nebutan', 'aomori-magurodo', 'aomori-ringoron'].includes(m.monsterId),
    ) ?? active;
  const element = p.content.monsters.get(starter?.monsterId ?? '')?.element;
  const artAssets = import.meta.env.BASE_URL + 'assets/sprites/animations/batch-01/iwate-kodamaru-v1.png';

  useEffect(() => () => ctrl.current?.abort(), []);
  useEffect(() => {
    dialog.current?.focus();
  }, [screen]);

  function begin(q: QuestionBase, replay = false) {
    origin.current = screen;
    ctrl.current?.abort();
    const run = new AbortController();
    ctrl.current = run;
    setQuestion(q);
    setResult(null);
    setScreen('question');
    void p
      .onReview(q.id, replay, host, run.signal)
      .then((ok) => {
        if (run.signal.aborted) return;
        if (ok && !replay && p.getGame().learning.pendingReviewStamps?.length) {
          setPressed(undefined);
          setStampSlot(p.getGame().learning.reviewStamps?.length ?? 0);
          setScreen('press');
        } else setResult(ok);
      })
      .catch(() => {
        if (!run.signal.aborted) setResult(false);
      });
  }
  function showCard() {
    setCard(cards(stamps));
    setScreen('card');
  }
  function back() {
    if (screen === 'home') p.onBack();
    else if (screen === 'question') {
      ctrl.current?.abort();
      setScreen(origin.current);
    } else if (screen === 'list') setScreen('subjects');
    else if (screen === 'detail' || screen === 'exchange') setScreen('card');
    else if (screen === 'press' && pressed) showCard();
    else setScreen('home');
  }
  function stampAt(e: TargetedMouseEvent<HTMLButtonElement>) {
    if (pressed || !pending) return;
    const r = e.currentTarget.querySelector('.nqn-target')?.getBoundingClientRect();
    if (!r) return;
    let x = e.detail ? (e.clientX - r.left) / r.width - 0.5 : 0;
    let y = e.detail ? (e.clientY - r.top) / r.height - 0.5 : 0;
    const d = Math.hypot(x, y);
    if (d > 0.18) {
      x *= 0.18 / d;
      y *= 0.18 / d;
    }
    p.onStamp(pending, x, y);
    const saved = p.getGame().learning.reviewStamps?.find((s) => s.questionId === pending);
    if (saved) setPressed(saved);
  }

  const rows = mistakes
    .filter((entry) => entry.q.subject === subject)
    .map((entry) => ({ ...entry, date: entry.at ? dateKey(entry.at) : '' }));
  const days = [...new Set(rows.map((r) => r.date))];
  const months = [...new Set(days.map((d) => d.slice(0, 7)))];
  const current = days.includes(date) ? date : days[0];
  const selectedMonth = months.includes(month) ? month : months[0];
  const showDate = (d: string) =>
    d
      ? t('field.notebook.date', { month: Number(d.slice(5, 7)), day: Number(d.slice(8)) })
      : label('unknownDate');
  const dayButton = (d: string) => (
    <button
      key={d || 'unknown'}
      aria-pressed={current === d && date !== 'archive' && date !== 'all'}
      onClick={() => setDate(d)}
    >
      <RubyLabel text={showDate(d)} />
      <small>
        <RubyLabel text={t('field.notebook.remaining', { n: rows.filter((r) => r.date === d).length })} />
      </small>
    </button>
  );
  const slot = stampSlot % 12;
  const pageStart = Math.floor(stampSlot / 12) * 12;
  const slice = stamps.slice(card * 12, card * 12 + 12);
  const picked = pressed ?? undefined;

  if (screen === 'question' && question)
    return (
      <div
        class="nq-wmap nqn-question"
        onKeyDown={(e) => {
          if (e.key === 'Escape') back();
        }}
      >
        <QuestionFrame
          host={host}
          title={t('field.tabMistakes')}
          subject={question.subject}
          hint={t('field.questionHint')}
        />
        <div class="nqn-question-actions">
          {result !== null && <RubyLabel text={label(result ? 'correct' : 'retry')} />}
          <button onClick={back}>
            <RubyLabel text={label('back')} />
          </button>
        </div>
      </div>
    );

  return (
    <div class="nq-wmap" onClick={p.onClose}>
      <div
        ref={dialog}
        class={`nq-win nq-wmap-box nq-menu-box nqn ${element ?? 'mori'}${screen === 'subjects' ? ' nqn-door-screen' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={t('field.tabMistakes')}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            e.stopPropagation();
            back();
          }
        }}
      >
        <header>
          <RubyLabel
            text={
              screen === 'list'
                ? t(`subjects.${subject}`)
                : screen === 'subjects'
                  ? label('doorTitle')
                  : t('field.tabMistakes')
            }
          />
        </header>
        <main>
          {screen === 'home' && (
            <div class="nqn-hero">
              <span
                class="nqn-companion"
                style={{ backgroundImage: `url(${artAssets})` }}
                aria-hidden="true"
              />
              <section class={pending || mistakes.length ? undefined : 'nqn-empty-speech'}>
                <h2>
                  <RubyLabel text={label(pending || mistakes.length ? 'invite' : 'companionEmpty')} />
                </h2>
                {pending ? (
                  <button
                    onClick={() => {
                      setPressed(undefined);
                      setStampSlot(stamps.length);
                      setScreen('press');
                    }}
                  >
                    <RubyLabel text={label('press')} />
                  </button>
                ) : mistakes.length ? (
                  <button onClick={() => mistakes[0] && begin(mistakes[0].q)}>
                    <RubyLabel text={label('start')} />
                  </button>
                ) : null}
              </section>
            </div>
          )}
          {screen === 'subjects' && (
            <div class="nqn-subjects">
              {subjects.map((s, i) => (
                <button
                  key={s}
                  style={{ '--nqn-door': doorColors[i] }}
                  onClick={() => {
                    setSubject(s);
                    setDate('');
                    setMonth('');
                    setScreen('list');
                  }}
                >
                  <i aria-hidden="true">{doorIcons[i]}</i>{' '}
                  <b>
                    <RubyLabel text={t(`subjects.${s}`)} />
                  </b>{' '}
                  <small>
                    <RubyLabel
                      text={t('field.notebook.questionCount', {
                        n: mistakes.filter((r) => r.q.subject === s).length,
                      })}
                    />
                  </small>
                </button>
              ))}
            </div>
          )}
          {screen === 'list' && (
            <div class="nqn-journal">
              <aside>
                <span
                  class="nqn-companion"
                  style={{ backgroundImage: `url(${artAssets})` }}
                  aria-hidden="true"
                />
                <RubyLabel text={label('chooseDate')} />
                <div class="nqn-dates">{days.slice(0, 4).map(dayButton)}</div>
                {days.length > 0 && (
                  <button onClick={() => setDate('archive')}>
                    <RubyLabel text={label('otherDates')} />
                  </button>
                )}
              </aside>
              <section>
                <div class="nqn-row">
                  <strong>
                    <RubyLabel
                      text={
                        date === 'archive'
                          ? label('otherDates')
                          : date === 'all'
                            ? label('unreviewed')
                            : days.length
                              ? showDate(current ?? '')
                              : label('empty')
                      }
                    />
                  </strong>
                  <button onClick={() => setDate('all')}>
                    <RubyLabel text={label('unreviewed')} />
                  </button>
                </div>
                {date === 'archive' ? (
                  <>
                    <div class="nqn-months">
                      {months.map((m) => (
                        <button
                          key={m || 'unknown'}
                          aria-pressed={m === selectedMonth}
                          onClick={() => setMonth(m)}
                        >
                          <RubyLabel text={m || label('unknownDate')} />
                        </button>
                      ))}
                    </div>
                    <div class="nqn-dates">
                      {days.filter((d) => d.slice(0, 7) === selectedMonth).map(dayButton)}
                    </div>
                  </>
                ) : (
                  <div class="nqn-questions">
                    {rows
                      .filter((row) => date === 'all' || row.date === current)
                      .map((row) => (
                        <button key={row.q.id} onClick={() => begin(row.q)}>
                          <span>
                            {date === 'all' && (
                              <small>
                                <RubyLabel text={showDate(row.date)} />
                              </small>
                            )}
                            <RubyLabel text={prompt(row.q)} />
                          </span>
                          <strong>
                            <RubyLabel text={label('retry')} />
                          </strong>
                        </button>
                      ))}
                  </div>
                )}
              </section>
            </div>
          )}
          {screen === 'press' && (
            <div class="nqn-press">
              <div class="nqn-row">
                <strong>
                  <RubyLabel text={label('correct')} />
                </strong>
                <RubyLabel text={t('field.notebook.cardNumber', { n: Math.floor(stampSlot / 12) + 1 })} />
              </div>
              <button class="nqn-zoom" onClick={stampAt} disabled={!!pressed} aria-label={label('press')}>
                <span
                  class="nqn-zoom-heading"
                  style={{ left: `${48 - (slot % 6) * 204}px`, top: `${14 - Math.floor(slot / 6) * 204}px` }}
                >
                  <RubyLabel text={label('cardTitle')} />
                </span>
                {Array.from({ length: 12 }, (_, i) => {
                  const s = i === slot ? picked : stamps[pageStart + i];
                  return (
                    <span
                      key={i}
                      class={`nqn-ring ${i === slot ? 'nqn-target' : ''}`}
                      style={{
                        left: `calc(50% + ${((i % 6) - (slot % 6)) * 204}px)`,
                        top: `calc(56% + ${(Math.floor(i / 6) - Math.floor(slot / 6)) * 204}px)`,
                      }}
                    >
                      {s ? (
                        <span
                          class={`nqn-print ${pressed && i === slot ? 'nqn-new-ink' : ''}`}
                          style={{ left: `${50 + s.x * 100}%`, top: `${50 + s.y * 100}%` }}
                        >
                          <Ink stamp={s} q={p.bank.get(s.questionId)} />
                        </span>
                      ) : (
                        i + 1
                      )}
                    </span>
                  );
                })}
              </button>
              {pressed && (
                <button
                  class="nqn-see-card"
                  onClick={() => {
                    setCard(Math.floor(stampSlot / 12));
                    setScreen('card');
                  }}
                >
                  <RubyLabel text={label('seeCard')} />
                </button>
              )}
              {!pressed && (
                <span>
                  <RubyLabel text={label('pressHint')} />
                </span>
              )}
            </div>
          )}
          {screen === 'card' && (
            <div class="nqn-card">
              <section>
                <div class="nqn-row">
                  <strong>
                    <RubyLabel text={label('cardTitle')} />
                  </strong>
                  <RubyLabel text={t('field.notebook.cardNumber', { n: card + 1 })} />
                </div>
                <div class="nqn-slots">
                  {Array.from({ length: 12 }, (_, i) => {
                    const s = slice[i];
                    return (
                      <button
                        key={i}
                        disabled={!s}
                        onClick={() => {
                          if (s) {
                            setDetail(s);
                            setScreen('detail');
                          }
                        }}
                        aria-label={s ? t('field.notebook.seeStamp', { n: i + 1 }) : undefined}
                      >
                        {s ? (
                          <span
                            class="nqn-print"
                            style={{ left: `${50 + s.x * 100}%`, top: `${50 + s.y * 100}%` }}
                          >
                            <Ink stamp={s} q={p.bank.get(s.questionId)} />
                          </span>
                        ) : (
                          i + 1
                        )}
                      </button>
                    );
                  })}
                </div>
              </section>
              <aside>
                <strong>
                  <RubyLabel text={t('field.notebook.progress', { n: slice.length })} />
                </strong>
                <RubyLabel text={label('cardRewards')} />
                {reviewStampRewards.map(({ count: n, itemId }) => (
                  <div key={n} class="nqn-reward">
                    <span aria-hidden="true">{slice.length >= n ? '☑' : '□'}</span>{' '}
                    <RubyLabel text={t('field.notebook.count', { n })} />
                    <RubyLabel text={p.content.items.get(itemId)?.name ?? ''} />
                  </div>
                ))}
                <RubyLabel
                  text={t('field.notebook.completedCards', { n: availableReviewCards(game.learning) })}
                />
              </aside>
            </div>
          )}
          {screen === 'detail' && detail && (
            <div class="nqn-panel">
              <h2>
                <RubyLabel text={label('stampDetails')} />
              </h2>
              <time>{dateKey(detail.at)}</time>
              {p.bank.get(detail.questionId) && (
                <>
                  <p>
                    <RubyLabel text={prompt(p.bank.get(detail.questionId)!)} />
                  </p>
                  <button onClick={() => begin(p.bank.get(detail.questionId)!, true)}>
                    <RubyLabel text={label('retry')} />
                  </button>
                </>
              )}
            </div>
          )}
          {screen === 'exchange' && (
            <div class="nqn-panel">
              <h2>
                <RubyLabel text={label('exchangeTitle')} />
              </h2>
              <p>
                <RubyLabel text={label('townExchange')} />
              </p>
              <RubyLabel
                text={t('field.notebook.completedCards', { n: availableReviewCards(game.learning) })}
              />
              <ul class="nqn-exchange">
                {reviewCardExchangeRewards.map((reward) => (
                  <li key={reward.cards}>
                    <RubyLabel text={t('field.notebook.exchangeCost', { n: reward.cards })} />
                    <RubyLabel text={p.content.items.get(reward.itemId)?.name ?? ''} />
                    <span>×{reward.quantity}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </main>
        <footer>
          <button onClick={back}>
            <RubyLabel text={label(screen === 'subjects' ? 'backCompanion' : 'back')} />
          </button>
          {screen === 'home' && (
            <button onClick={() => setScreen('subjects')}>
              <RubyLabel text={label('chooseSubject')} />
            </button>
          )}
          {(screen === 'home' || screen === 'subjects') && (
            <button onClick={showCard}>
              <RubyLabel text={label(screen === 'subjects' ? 'doorCard' : 'seeCard')} />
            </button>
          )}
          {screen === 'card' && (
            <>
              {card > 0 && (
                <button onClick={() => setCard(card - 1)}>
                  <RubyLabel text={label('previousCard')} />
                </button>
              )}
              {card < cards(stamps) && (
                <button onClick={() => setCard(card + 1)}>
                  <RubyLabel text={label('nextCard')} />
                </button>
              )}
              <button onClick={() => setScreen('exchange')}>
                <RubyLabel text={label('exchange')} />
              </button>
            </>
          )}
        </footer>
      </div>
    </div>
  );
}
