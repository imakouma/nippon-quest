/**
 * BattleEvent → メッセージウィンドウの文（RubyText）。文言は content/i18n/ja.json の battle.*。
 * Phaser も DOM も使わない純粋関数なのでテストできる。
 * リアルタイムなので、いつも 出る こと（ゲージが たまった・コマンドゲージが たまった）は 文に しない（絵と 数字で 見せる）。
 */
import type { Element } from '../../core/content/schemas';
import type { BattleEvent } from '../../core/battle/types';
import { t } from '../../ui/i18n';

export interface NarrateCtx {
  /** Combatant.id → 表示名（RubyText） */
  nameOf(id: string): string;
  skillName(id: string): string;
  itemName(id: string): string;
  elementName(el: Element): string;
  subjectName(subject: string): string;
  enemyName: string;
  isBossBattle: boolean;
}

/**
 * 「かいふく → どうぐを使った」の順でイベントが来たら、
 * 読む順（どうぐを使った → かいふく）に並べ替える。
 */
export function normalizeEvents(events: readonly BattleEvent[]): BattleEvent[] {
  const out = [...events];
  for (let i = 1; i < out.length; i++) {
    const cur = out[i]!;
    const prev = out[i - 1]!;
    if (cur.t === 'itemUsed' && prev.t === 'heal' && prev.targetId === cur.targetId) {
      out[i - 1] = cur;
      out[i] = prev;
    }
  }
  return out;
}

export function narrate(e: BattleEvent, ctx: NarrateCtx, prev?: BattleEvent): string[] {
  switch (e.t) {
    case 'act': {
      const name = ctx.nameOf(e.actorId);
      if (e.command === 'attack') return [t('battle.attack', { name })];
      if (e.command === 'skill' && e.skillId)
        return [t('battle.skillUse', { name, skill: ctx.skillName(e.skillId) })];
      if (e.command === 'scan') return [t('battle.scan', { name })];
      if (e.command === 'defend') return [t('battle.defend', { name })];
      return [];
    }
    case 'damage': {
      const lines = e.critical ? [t('battle.crit')] : [];
      lines.push(
        e.side === 'enemy'
          ? t('battle.damageToEnemy', { name: ctx.enemyName, n: e.amount })
          : t('battle.damageToAlly', { name: ctx.nameOf(e.targetId), n: e.amount }),
      );
      if (e.weakness) lines.push(t('battle.weaknessHit'));
      if (e.elementMult > 1) lines.push(t('battle.superEffective'));
      else if (e.elementMult < 1) lines.push(t('battle.notEffective'));
      return lines;
    }
    case 'heal':
      return [t('battle.heal', { name: ctx.nameOf(e.targetId), n: e.amount })];
    case 'buff': {
      // 「みを まもっている！」の直後の防御アップは言い直さない
      if (prev?.t === 'act' && prev.command === 'defend') return [];
      const name = e.side === 'enemy' ? ctx.enemyName : ctx.nameOf(e.targetId);
      return [t(e.mult >= 1 ? 'battle.defUp' : 'battle.defDown', { name })];
    }
    case 'status':
      return [t('battle.statusStop', { name: ctx.enemyName, n: e.turns })];
    case 'skipTurn':
      return [t('battle.skipTurn', { name: ctx.enemyName })];
    case 'weaknessRevealed':
      return [t('battle.weaknessRevealed', { name: ctx.enemyName, element: ctx.elementName(e.element) })];
    case 'scanFailed':
      return [t('battle.scanFailed')];
    case 'combo':
      return [t('battle.combo', { n: e.count, p: Math.round((e.bonus - 1) * 100) })];
    case 'gaugeCharge': {
      const subject = ctx.subjectName(e.subject);
      if (e.unlocked.length)
        return [t('battle.skillUnlocked', { skill: e.unlocked.map((id) => ctx.skillName(id)).join('・') })];
      return e.value >= e.max ? [t('battle.gaugeFull', { subject })] : [];
    }
    case 'gaugeShort':
      return [t('battle.gaugeShort', { subject: ctx.subjectName(e.subject), n: e.need - e.have })];
    case 'itemUsed':
      return [t('battle.itemUsed', { name: ctx.nameOf(e.targetId), item: ctx.itemName(e.itemId) })];
    case 'swap':
      return e.auto
        ? [t('battle.swapAuto', { to: ctx.nameOf(e.to) })]
        : [t('battle.swap', { from: ctx.nameOf(e.from), to: ctx.nameOf(e.to) })];
    case 'recruitAttempt': {
      const lines = [t('battle.recruitTry', { name: ctx.enemyName })];
      if (!e.success) lines.push(t('battle.recruitFail', { name: ctx.enemyName }));
      return lines;
    }
    case 'recruited':
      return [t('battle.recruitSuccess', { name: ctx.enemyName })];
    case 'fleeAttempt':
      if (e.success) return [];
      return [t(ctx.isBossBattle ? 'battle.fleeBoss' : 'battle.fleeFail')];
    case 'fled':
      return [t('battle.fleeSuccess')];
    case 'ko':
      return e.side === 'enemy'
        ? [t('battle.koEnemy', { name: ctx.enemyName })]
        : [t('battle.koAlly', { name: ctx.nameOf(e.targetId) })];
    case 'bossPhase': {
      const lines = [t('battle.bossPhase', { name: ctx.enemyName })];
      if (e.line) lines.push(`「${e.line}」`);
      return lines;
    }
    case 'defeat':
      return [t('battle.defeat')];
    case 'gaugeUse':
    case 'turnStart':
    case 'victory':
      return [];
  }
}
