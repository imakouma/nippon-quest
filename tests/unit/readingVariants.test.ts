import { describe, expect, it } from 'vitest';
import { textInputScore } from '../../src/questions/renderers/text-input/schema';

describe('同じ語の読みのゆれ', () => {
  it.each([
    ['貴い たいけんを する', 'とうと', 'たっと', 'い'],
    ['尊い いのちを まもる', 'とうと', 'たっと', 'い'],
    ['これは 私の ほんです', 'わたし', 'わたくし', ''],
    ['あり得る ことを かんがえる', 'う', 'え', 'る'],
    ['家に かえる', 'いえ', 'うち', ''],
    ['とりの 羽を みる', 'はね', 'は', ''],
    ['きと きの 間を とおる', 'あいだ', 'ま', ''],
    ['いけで 魚が およぐ', 'さかな', 'うお', ''],
    ['がっこうへ 行く', 'い', 'ゆ', 'く'],
    ['夜に ほしを みる', 'よる', 'よ', ''],
    ['ごはんの 後に はを みがく', 'あと', 'のち', ''],
    ['この いえの 主を たずねる', 'ぬし', 'あるじ', ''],
    ['コップに みずを 注ぐ', 'そそ', 'つ', 'ぐ'],
    ['じどうで ドアが 開く', 'あ', 'ひら', 'く'],
    ['軽やかな あしどり', 'かろ', 'かる', 'やか'],
    ['ろうそくの 灯が ゆれる', 'ひ', 'あかり', ''],
    ['ろうそくの 灯が ゆれる', 'ひ', 'ともしび', ''],
    ['てんきが 良い', 'よ', 'い', 'い'],
    ['はなの 香を かぐ', 'か', 'かおり', ''],
    ['うまれたばかりの 初ごを だく', 'うい', 'はつ', ''],
    ['へやに 居る', 'い', 'お', 'る'],
    ['あには いえに 居る', 'い', 'お', 'る'],
    ['むすびめを 解く', 'と', 'ほど', 'く'],
    ['１ぽ うしろに 退く', 'しりぞ', 'の', 'く'],
    ['１ぽ うしろに 退く', 'しりぞ', 'ど', 'く'],
    ['１ぽ うしろに 退く', 'しりぞ', 'ひ', 'く'],
    ['難しい もんだいを とく', 'むずか', 'むつか', 'しい'],
    ['遺ごんを かきのこす', 'ゆい', 'い', ''],
  ])('%s はどちらの正しい読みも受け付ける', (prompt, answer, variant, ending) => {
    const payload = { prompt, template: `よみかた：{{INPUT}}${ending}`, answers: [answer] };
    expect(textInputScore(payload, [answer])).toBe(1);
    expect(textInputScore(payload, [variant])).toBe(1);
    expect(textInputScore(payload, ['まちがい'])).toBe(0);
    if (ending) expect(textInputScore(payload, [variant + ending])).toBe(0);
  });

  it('他の漢字や別の語へ読みのゆれを適用しない', () => {
    expect(textInputScore({ prompt: 'ほんを 開く', answers: ['ひら'] }, ['あ'])).toBe(0);
    expect(textInputScore({ prompt: 'まどを 開ける', answers: ['あ'] }, ['ひら'])).toBe(0);
    expect(textInputScore({ prompt: 'なぞが 解ける', answers: ['と'] }, ['ほど'])).toBe(0);
    expect(textInputScore({ prompt: 'ちゅういを 注ぐ', answers: ['そそ'] }, ['つ'])).toBe(0);
    expect(textInputScore({ prompt: '後ろを みる', answers: ['うし'] }, ['のち'])).toBe(0);
    expect(textInputScore({ prompt: '軽い にもつ', answers: ['かる'] }, ['かろ'])).toBe(0);
    expect(textInputScore({ prompt: 'やむを得ない', answers: ['え'] }, ['う'])).toBe(0);
    expect(textInputScore({ prompt: '荷を はこぶ', answers: ['に'] }, ['たっと'])).toBe(0);
    expect(textInputScore({ prompt: '尊い', answers: ['たっと'] }, ['とうと'])).toBe(1);
    expect(textInputScore({ prompt: 'わたし と かこう', answers: ['わたし'] }, ['わたくし'])).toBe(0);
    expect(textInputScore({ prompt: '私りつの がっこう', answers: ['し'] }, ['わたし'])).toBe(0);
  });
});
