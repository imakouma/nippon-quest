/**
 * 問題の枠（バトルの「わざ」と、フィールドの名所イベントで共通）。
 * ask() に渡す host をこの中に差し込むだけ。問題の中身（レンダラー）には触らない。
 * aside を わたすと、見出しの 右（ヒントの 場所）に 出す（バトルでは 敵の こうげきタイマーと HP）。
 */
import type { ComponentChildren } from 'preact';
import { useLayoutEffect, useRef } from 'preact/hooks';
import { SubjectChip } from './chips';
import { RubyLabel } from './RubyLabel';
import { displayText } from './ruby';

export interface QuestionFrameProps {
  host: HTMLElement;
  title: string;
  subject: string;
  hint: string;
  aside?: ComponentChildren;
  class?: string;
}

export function QuestionFrame({ host, title, subject, hint, aside, class: cls }: QuestionFrameProps) {
  const slot = useRef<HTMLDivElement>(null);
  // ask() は host へ直ちに問題を描画する。通常 effect まで待つと、重いCanvas描画中に
  // 問題が画面へ差し込まれないまま制限時間だけ進むため、DOM確定直後に同期して接続する。
  useLayoutEffect(() => {
    slot.current?.appendChild(host);
    return () => host.remove();
  }, [host]);
  return (
    <div class={`nq-win nq-bq ${cls ?? ''}`} role="dialog" aria-label={displayText(title)}>
      <div class="nq-bq-head">
        <SubjectChip subject={subject} />
        <RubyLabel text={title} class="nq-bq-name" />
        {aside ?? (
          <span class="nq-bq-hint">
            <RubyLabel text={hint} />
          </span>
        )}
      </div>
      <div class="nq-bq-host" ref={slot} />
    </div>
  );
}
