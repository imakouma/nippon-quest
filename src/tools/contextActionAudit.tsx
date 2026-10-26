import { render } from 'preact';
import ja from '../../content/i18n/ja.json';
import {
  resolveContextAction,
  type ContextActionKind,
  type ContextActionState,
} from '../scenes/overworld/contextAction';
import { ContextActionButton } from '../ui/field/ContextActionButton';
import { setDictionary, t } from '../ui/i18n';
import '../ui/app.css';
import '../ui/field/field.css';
import './contextActionAudit.css';

setDictionary(ja);

const params = new URLSearchParams(location.search);
const locked = params.get('lock') as keyof ContextActionState | null;
const state: ContextActionState = {
  moving: false,
  turning: false,
  bumping: false,
  busy: false,
  inBattle: false,
  overlayOwnsInput: false,
  ...(locked ? { [locked]: true } : {}),
};
let activationCount = 0;
const count = document.createElement('output');
count.id = 'activation-count';
count.value = '0';
const activate = () => {
  activationCount += 1;
  count.value = String(activationCount);
};
const target = params.get('target');
const action = resolveContextAction({
  state,
  front:
    target === 'inspect'
      ? { inspect: activate }
      : target === 'chest'
        ? { chest: { opened: false, onActivate: activate } }
        : { npc: activate },
  current: {},
  surrounding: [],
});
const labelKeys: Record<ContextActionKind, string> = {
  talk: 'field.contextTalk',
  inspect: 'field.contextInspect',
  open: 'field.contextOpen',
};
const root = document.getElementById('context-action-audit')!;
render(
  <>
    <div id="audit-ground" tabIndex={-1} />
    <div class="audit-mini" data-required-control="mini-map" />
    <div class="audit-menu" data-required-control="menu" />
    <div class="audit-stick" data-required-control="move" />
    <ContextActionButton action={action ? { ...action, label: t(labelKeys[action.kind]) } : null} />
  </>,
  root,
);
root.append(count);

document.addEventListener('keydown', (event) => {
  if (!action || event.repeat) return;
  if (event.target instanceof HTMLButtonElement) return;
  if (event.key === 'Enter' || event.key === ' ' || event.key.toLowerCase() === 'z') {
    event.preventDefault();
    action.onActivate();
  }
});
