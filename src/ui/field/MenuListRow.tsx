import { Component } from 'preact';
import type { MenuEntry } from '../../shared/menuModel';
import { RubyLabel } from '../RubyLabel';
import { displayText } from '../ruby';

export type MenuPick = (index: number, ensureVisible?: boolean) => void;

/** 大きな図鑑で、選択前後の行以外を再描画しない。 */
interface MenuListRowProps {
  entry: MenuEntry;
  index: number;
  selected: boolean;
  compactMeta?: boolean;
  numberOnly?: boolean;
  onPick: MenuPick;
  onActivate?: MenuPick;
  expanded?: boolean;
}

export class MenuListRow extends Component<MenuListRowProps> {
  override shouldComponentUpdate(next: MenuListRowProps) {
    return (
      next.entry !== this.props.entry ||
      next.index !== this.props.index ||
      next.selected !== this.props.selected ||
      next.compactMeta !== this.props.compactMeta ||
      next.numberOnly !== this.props.numberOnly ||
      next.onActivate !== this.props.onActivate ||
      next.expanded !== this.props.expanded ||
      next.onPick !== this.props.onPick
    );
  }

  override render({
    entry,
    index,
    selected,
    compactMeta = false,
    numberOnly = false,
    onPick,
    onActivate,
    expanded,
  }: MenuListRowProps) {
    const icon = numberOnly && !entry.known ? undefined : (entry.icon ?? entry.getIcon?.());
    return (
      <li>
        <button
          type="button"
          data-menu-entry
          class={`nq-opt ${selected ? 'nq-focus' : ''} ${entry.known ? '' : 'nq-menu-unknown'}`}
          aria-expanded={expanded}
          aria-current={selected ? 'true' : undefined}
          aria-label={
            numberOnly
              ? displayText([entry.right, entry.name, entry.tag].filter(Boolean).join(' '))
              : undefined
          }
          onPointerEnter={numberOnly ? undefined : () => onPick(index)}
          onClick={() => (onActivate ?? onPick)(index)}
        >
          {numberOnly && <RubyLabel text={entry.right ?? ''} class="nq-dex-card-number" />}
          <span class="nq-amap-cur">{selected && <span class="nq-heart">♥</span>}</span>
          {icon ? (
            <img class="nq-item-icon nq-town-icon nq-menu-icon" src={icon} alt="" />
          ) : (
            numberOnly && (
              <span class="nq-dex-card-unknown" aria-hidden="true">
                ？
              </span>
            )
          )}
          <span class={compactMeta ? 'nq-mistake-row-copy' : undefined}>
            <RubyLabel text={entry.name} class="nq-opt-name" />
            {compactMeta && entry.sub && <RubyLabel text={entry.sub} class="nq-mistake-row-meta" />}
          </span>
          {!numberOnly && entry.tag && <span class="nq-party-tag">{entry.tag}</span>}
          {!numberOnly && entry.right && <RubyLabel text={entry.right} class="nq-town-right" />}
        </button>
      </li>
    );
  }
}
