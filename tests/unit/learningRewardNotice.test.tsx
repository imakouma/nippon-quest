// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { setDictionary, type I18nDict } from '../../src/ui/i18n';
import { showLearningRewardNotice } from '../../src/ui/learningRewardNotice';

afterEach(() => {
  vi.useRealTimers();
  document.body.replaceChildren();
});

describe('学習素材の獲得通知', () => {
  it('獲得理由と個数をルビ付きで読み上げ可能な通知にする', () => {
    vi.useFakeTimers();
    setDictionary({
      field: {
        learningRewardReason: {
          mastery: '単元[たんげん]を マスター！',
          correction: 'まちがいを 3もん なおした！',
        },
        learningRewardGained: 'まなびの かけら +{n}',
      },
    } as I18nDict);
    const layer = document.createElement('div');
    document.body.append(layer);

    showLearningRewardNotice(layer, { earned: 2, reasons: ['mastery', 'correction'] });

    const notice = layer.querySelector('[role="status"]');
    expect(notice?.textContent).toContain('単元たんげんを マスター！');
    expect(notice?.textContent).toContain('まちがいを 3もん なおした！');
    expect(notice?.textContent).toContain('まなびの かけら +2');
    expect(notice?.querySelector('ruby')).not.toBeNull();
    vi.advanceTimersByTime(4_000);
    expect(layer.querySelector('[role="status"]')).toBeNull();
  });
});
