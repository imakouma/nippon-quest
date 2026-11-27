import { expect, test } from '@playwright/test';
import { advanceQuestionFeedback } from './helpers/questionReview';
import { completeNewGameSetup } from './newGame';
import type Phaser from 'phaser';
import type { BattleState } from '../../src/core/battle/types';
import type { ContentIndex } from '../../src/core/content/loader';
import type { Skill } from '../../src/core/content/schemas';
import type { GameState } from '../../src/core/state/schema';
import type { QuestionBank } from '../../src/questions/engine/bank';

type SkillBattle = Phaser.Scene & {
  bank: QuestionBank;
  content: ContentIndex;
  gs: GameState;
  state: BattleState;
  askSkill(skill: Skill): Promise<{ score: number }>;
  syncViews(): void;
  showCommands(): void;
};

declare global {
  interface Window {
    __subjectSkillResult: Promise<{ score: number }>;
  }
}

const examples = [
  { subject: 'sansu', grade: 1, question: 'sansu.g1.tokei.0001', skill: 'sk-math-1-09', answer: '7じ' },
  {
    subject: 'kokugo',
    grade: 1,
    question: 'kokugo.g1.katakana.0001',
    skill: 'sk-kokugo-1-kana',
    answer: 'バス',
  },
  {
    subject: 'eigo',
    grade: 3,
    question: 'eigo.g3.greetings-preferences.0001',
    skill: 'sk-eigo-greeting',
    answer: 'Good morning.',
  },
  {
    subject: 'seikatsu',
    grade: 1,
    question: 'seikatsu.g1.next-grade.0002',
    skill: 'sk-seikatsu-growth',
    answer: 'れんしゅうして、できることが ふえた',
  },
  {
    subject: 'rika',
    grade: 3,
    question: 'legacy.rika.g3.cur-1503-10.e58ebf4e9b98',
    skill: 'sk-rika-g3-weight',
    answer: 'グラム',
  },
  {
    subject: 'shakai',
    grade: 3,
    question: 'legacy.shakai.g3.cur-1403-04.6c7309d0aa1f',
    skill: 'sk-shakai-g3-change',
    answer: 'そろばん',
  },
] as const;

for (const item of examples) {
  test(`${item.subject}: 問題の正解で技を習得し戦闘で選べる`, async ({ page }) => {
    test.setTimeout(120_000);
    await page.goto(`/?debug=battle&grade=${item.grade}&resetSaves=1`);
    await expect(page.locator('.nq-box-next')).toBeVisible({ timeout: 60_000 });
    await page.locator('.nq-box').click();
    await page.evaluate(({ question, skill }) => {
      const battle = window.__nq.scene.getScene('Battle') as SkillBattle;
      const entry = battle.bank.get(question);
      const learned = battle.content.skills.get(skill);
      if (!entry || !learned) throw new Error(`fixture missing: ${question} / ${skill}`);
      const subject = battle.bank.subject.bind(battle.bank);
      battle.bank.subject = (name) => (name === entry.subject ? [entry] : subject(name));
      battle.gs.player.skills = battle.gs.player.skills.filter((id) => id !== skill);
      window.__subjectSkillResult = battle.askSkill(learned);
    }, item);
    const correct = page
      .locator('.nq-choice')
      .filter({ has: page.locator('.nq-choice-content').getByText(item.answer, { exact: true }) });
    await correct.click();
    if (item.subject === 'sansu') await advanceQuestionFeedback(page);
    await expect.poll(() => page.evaluate(async () => (await window.__subjectSkillResult).score)).toBe(1);
    const learned = await page.evaluate(({ skill, subject }) => {
      const battle = window.__nq.scene.getScene('Battle') as SkillBattle;
      const prefix = subject === 'sansu' ? 'math' : subject;
      return {
        skills: battle.gs.player.skills,
        count: battle.gs.progress.counters[`${prefix}-training:${skill}`],
      };
    }, item);
    expect(learned.skills).toContain(item.skill);
    expect(learned.count).toBe(1);
    await page.evaluate(({ skill }) => {
      const battle = window.__nq.scene.getScene('Battle') as SkillBattle;
      battle.state.ally.hero.skills = [skill];
      battle.syncViews();
      battle.showCommands();
    }, item);
    await page.locator('[data-cmd="skill"]').click();
    await expect(page.locator(`[data-skill="${item.skill}"]`)).toBeVisible();
    await page.locator(`[data-skill="${item.skill}"]`).click();
    await expect(correct).toBeVisible();
    await correct.click();
    if (item.subject === 'sansu') await advanceQuestionFeedback(page);
    await expect
      .poll(
        async () =>
          page.evaluate(({ skill, subject }) => {
            const battle = window.__nq.scene.getScene('Battle') as SkillBattle;
            return battle.gs.progress.counters[`${subject === 'sansu' ? 'math' : subject}-training:${skill}`];
          }, item),
        { timeout: 20_000 },
      )
      .toBe(2);
    await expect
      .poll(
        () =>
          page.evaluate(() => {
            const battle = window.__nq.scene.getScene('Battle') as SkillBattle;
            return battle.state.turn > 1 || battle.state.outcome !== 'ongoing';
          }),
        { timeout: 30_000 },
      )
      .toBe(true);
  });
}

test('各教科の習得済み技を編成画面で選んで保存できる', async ({ page }) => {
  test.setTimeout(180_000);
  await page.goto('/?resetSaves=1');
  await page.getByRole('menuitem', { name: /はじめから/ }).click();
  await page.getByRole('button', { name: /スロット 1/ }).click();
  await completeNewGameSetup(page, 'テスト');
  const names = [
    'とけいのはり',
    'かなのきらめき',
    'ハローウィンド',
    'せいちょうの ひかり',
    'おもさくらべ',
    'くらしのあゆみ',
  ];
  await page.evaluate(
    (ids) => {
      const game = window.__nq;
      const state = game.registry.get('game') as GameState;
      state.player.skills = [...new Set([...state.player.skills, ...ids])];
      game.registry.set('game', state);
    },
    examples.map((item) => item.skill),
  );
  await page.getByRole('button', { name: 'メニュー', exact: true }).click();
  await page
    .getByRole('group', { name: 'メニュー' })
    .getByRole('button', { name: 'わざ', exact: true })
    .click();
  const editor = page.getByRole('region', { name: 'わざの へんせい' });
  const slots = editor.getByRole('group', { name: /ふつうの わざ/ }).getByRole('button');
  for (const [index, item] of examples.entries()) {
    await slots.nth(3).click();
    await editor.getByRole('button', { name: new RegExp(names[index]!) }).click();
    await editor.getByRole('button', { name: 'この わざを つける' }).click();
    await expect
      .poll(() =>
        page.evaluate((id) => {
          const state = window.__nq.registry.get('game') as GameState;
          return state.player.skillLoadout?.normal.includes(id) ?? false;
        }, item.skill),
      )
      .toBe(true);
  }
});
