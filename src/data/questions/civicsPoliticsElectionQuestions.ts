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
  const modeId: CivicsModeId = "civics-politics-election";
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
    tags: opts.tags ?? ["公民", "政治や選挙"],
  };
}

/** 政治や選挙分野の専用問題 */
export function buildCivicsPoliticsElectionQuestions(): Question[] {
  return [
    mcQuestion(0, {
      text: "選挙権を持てる年齢として、正しいものはどれですか？",
      choices: ["18歳以上", "12歳以上", "15歳以上", "25歳以上"],
      correctIndex: 0,
      explanation:
        "日本では18歳以上の国民が選挙権を持ち、投票によって政治に参加できます。",
      hint: "高校生になるころから投票できる年齢だよ。",
      difficulty: 1,
      learningPoint: "選挙権",
      tags: ["政治や選挙", "選挙権"],
    }),
    mcQuestion(1, {
      text: "国会が持つ権限として、正しいものはどれですか？",
      choices: [
        "法律を作る",
        "裁判を行う",
        "消防活動を行う",
        "郵便を届ける",
      ],
      correctIndex: 0,
      explanation:
        "国会は法律を作る立法権を持ち、国の政治の中心となる機関です。",
      hint: "三権分立のうち、国会の役割を考えてみよう。",
      difficulty: 1,
      learningPoint: "国会の権限",
      tags: ["政治や選挙", "国会"],
    }),
    mcQuestion(2, {
      text: "国会が行う仕事として、正しいものはどれですか？",
      choices: [
        "国のお金の使い方（予算）を決める",
        "市のゴミを収集する",
        "天気予報を行う",
        "商店の値段を決める",
      ],
      correctIndex: 0,
      explanation:
        "国会は、法律を作るほかに、国の予算を議決するなど、国の重要なことを決めます。",
      hint: "税金などで集めた国のお金をどう使うか、だれが決めるかな？",
      difficulty: 1,
      learningPoint: "国会の権限",
      tags: ["政治や選挙", "国会", "予算"],
    }),
    mcQuestion(3, {
      text: "国会を構成する両院の組み合わせとして、正しいものはどれですか？",
      choices: [
        "衆議院と参議院",
        "衆議院と裁判所",
        "内閣と参議院",
        "市議会と県議会",
      ],
      correctIndex: 0,
      explanation:
        "国会は衆議院と参議院の二院制で、両方の議院が法律や予算などを議決します。",
      hint: "「院」が2つある国会の名前を思い出そう。",
      difficulty: 1,
      learningPoint: "国会",
      tags: ["政治や選挙", "国会", "二院制"],
    }),
    mcQuestion(4, {
      text: "選挙の意味として、正しいものはどれですか？",
      choices: [
        "国民が代表者を選び、政治に参加すること",
        "市長だけが勝手に決めること",
        "外国の人が日本の政治を決めること",
        "くじ引きで代表者を決めること",
      ],
      correctIndex: 0,
      explanation:
        "選挙は、国民が投票して代表者を選び、自分たちの意思を政治に反映させる大切な仕組みです。",
      hint: "投票箱に票を入れるのは、どんな目的かな？",
      difficulty: 1,
      learningPoint: "選挙",
      tags: ["政治や選挙", "選挙"],
    }),
  ];
}
