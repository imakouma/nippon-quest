import type { I18nDict } from './i18n';

/** 通常辞書そのものを読み込めない場合にも、復旧操作だけは案内できる最小辞書。 */
export const BOOTSTRAP_JA = {
  ui: {
    loadError: 'よみこみに しっぱいしました。\n\nつうしんを たしかめて、もういちど おしてね。',
    retry: 'もういちど',
  },
} satisfies I18nDict;
