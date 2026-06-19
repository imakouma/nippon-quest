import type { Question } from "@/types/question";
import type { CivicsModeId } from "@/data/civicsModes";

function mcQuestion(
  index: number,
  opts: {
    text: string;
    choices: [string, string, string, string];
    correctIndex: 0 | 1 | 2 | 3;
    explanation: string;
    hint: string;
    difficulty?: 1 | 2 | 3;
    learningPoint: string;
    tags?: string[];
  },
): Question {
  const ids = ["a", "b", "c", "d"] as const;
  const modeId: CivicsModeId = "civics-constitution";
  return {
    id: `${modeId}_extra_q${String(index + 1).padStart(3, "0")}`,
    unit_id: modeId,
    type: "multiple_choice",
    difficulty: opts.difficulty ?? 2,
    question: {
      text: opts.text,
      choices: opts.choices.map((text, i) => ({ id: ids[i], text })),
    },
    answer: { correct_ids: [ids[opts.correctIndex]] },
    explanation: { short: opts.explanation },
    curriculum_ref: {
      grade: 6,
      unit_number: 1,
      learning_point: opts.learningPoint,
    },
    hint: opts.hint,
    tags: opts.tags ?? ["公民", "憲法"],
  };
}

/** 憲法分野の専用問題 */
export function buildCivicsConstitutionQuestions(): Question[] {
  return [
    mcQuestion(0, {
      text: "日本国憲法が公布された年はどれですか？",
      choices: ["1946年", "1868年", "1603年", "1945年"],
      correctIndex: 0,
      explanation:
        "日本国憲法は1946年11月3日に公布され、1947年5月3日から施行されました。",
      hint: "第二次世界大戦のあと、戦後に作られた憲法だよ。",
      difficulty: 1,
      learningPoint: "憲法の公布",
      tags: ["憲法", "公布"],
    }),
    mcQuestion(1, {
      text: "日本国憲法の三大原則として、正しいものはどれですか？",
      choices: [
        "国民主権・基本的人権の尊重・平和主義",
        "天皇主権・軍国主義・身分制度",
        "武士の政治・農業のみ・戦争の推進",
        "貴族の支配・鎖国・海外進出",
      ],
      correctIndex: 0,
      explanation:
        "日本国憲法の三大原則は、国民主権・基本的人権の尊重・平和主義の3つです。",
      hint: "「国民」「人権」「平和」に関する原則を考えてみよう。",
      difficulty: 1,
      learningPoint: "三大原則",
      tags: ["憲法", "三大原則"],
    }),
    mcQuestion(2, {
      text: "国民主権の考え方として、正しいものはどれですか？",
      choices: [
        "国の政治は国民の意思で決められる",
        "天皇だけが国のことを決める",
        "外国の人が政治を行う",
        "政治に国民は関わらない",
      ],
      correctIndex: 0,
      explanation:
        "国民主権は、国の政治の最終的な決定権が国民にあるという考え方です。",
      hint: "「主権」は「しゅけん」。だれが国の主人かを考えてみよう。",
      difficulty: 1,
      learningPoint: "国民主権",
      tags: ["憲法", "国民主権"],
    }),
    mcQuestion(3, {
      text: "基本的人権の尊重について、正しい説明はどれですか？",
      choices: [
        "すべての人が生まれながらに大切にされる権利がある",
        "一部の人だけが権利を持つ",
        "人権は憲法に書かれていない",
        "人権は戦争のときだけ認められる",
      ],
      correctIndex: 0,
      explanation:
        "基本的人権の尊重は、すべての人が生まれながらに持つ大切な権利を守るという原則です。",
      hint: "「基本的人権」は、すべての人に共通する大切な権利のことだよ。",
      difficulty: 1,
      learningPoint: "基本的人権の尊重",
      tags: ["憲法", "基本的人権"],
    }),
    mcQuestion(4, {
      text: "平和主義について、日本国憲法で定められていることとして正しいものはどれですか？",
      choices: [
        "戦争を放棄し、武力による国際紛争の解決をしない",
        "いつでも自由に戦争をしてよい",
        "軍隊を大きく育てることが目的である",
        "外国を支配することが認められている",
      ],
      correctIndex: 0,
      explanation:
        "平和主義では、戦争の放棄や武力の不行使など、平和を大切にする考え方が憲法に定められています。",
      hint: "戦後の日本が大切にしている「平和」について考えてみよう。",
      difficulty: 1,
      learningPoint: "平和主義",
      tags: ["憲法", "平和主義"],
    }),
  ];
}
