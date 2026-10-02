import type { QuestionBase } from '../questions/contracts';

/** Webエディタを開いた直後から、現行レンダラーで試せる有効なサンプル。 */
export const SAMPLE_QUESTIONS: QuestionBase[] = [
  {
    id: 'sansu.g1.tashizan.0001',
    type: 'choice',
    subject: 'sansu',
    grade: 1,
    unit: 'sansu.g1.tashizan',
    timeLimitSec: 20,
    tags: ['たしざん', '基本'],
    explanation: '3 と 4 を あわせると 7 に なります。',
    payload: {
      prompt: '3 + 4 = ?',
      choices: [
        { id: 'five', text: '5' },
        { id: 'six', text: '6' },
        { id: 'seven', text: '7' },
        { id: 'eight', text: '8' },
      ],
      answer: 'seven',
    },
  },
  {
    id: 'eigo.g1.alphabet.0001',
    type: 'picture-word',
    subject: 'eigo',
    grade: 1,
    unit: 'eigo.g1.alphabet',
    timeLimitSec: 20,
    tags: ['単語', 'くだもの'],
    explanation: 'apple（アップル）は 「りんご」です。',
    payload: {
      image: 'questions/eigo/apple.png',
      words: [
        { id: 'apple', text: 'apple', audio: 'questions/eigo/apple.mp3' },
        { id: 'banana', text: 'banana' },
        { id: 'orange', text: 'orange' },
      ],
      answer: 'apple',
    },
  },
];
