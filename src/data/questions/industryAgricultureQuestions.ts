import type { Question } from "@/types/question";
import { JAPAN_PIN } from "@/data/maps/japanPinCoords";

type PinId = keyof typeof JAPAN_PIN;

function pins(...ids: PinId[]) {
  return ids.map((id) => JAPAN_PIN[id]);
}

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
    detail?: string;
  },
): Question {
  const ids = ["a", "b", "c", "d"] as const;
  return {
    id: `ind_agri_rice_q${String(index + 1).padStart(3, "0")}`,
    unit_id: "industry-agriculture",
    type: "multiple_choice",
    difficulty: opts.difficulty ?? 2,
    question: {
      text: opts.text,
      choices: opts.choices.map((text, i) => ({ id: ids[i], text })),
    },
    answer: { correct_ids: [ids[opts.correctIndex]] },
    explanation: {
      short: opts.explanation,
      ...(opts.detail ? { detail: opts.detail } : {}),
    },
    curriculum_ref: {
      grade: 5,
      unit_number: 2,
      learning_point: opts.learningPoint,
    },
    hint: opts.hint,
    tags: opts.tags ?? ["稲作", "農業"],
  };
}

function mapPinQuestion(
  index: number,
  opts: {
    text: string;
    correctId: PinId;
    pinIds: PinId[];
    explanation: string;
    hint: string;
    difficulty?: 1 | 2;
    learningPoint: string;
    tags?: string[];
  },
): Question {
  return {
    id: `ind_agri_rice_q${String(index + 1).padStart(3, "0")}`,
    unit_id: "industry-agriculture",
    type: "map_pin",
    difficulty: opts.difficulty ?? 2,
    question: {
      text: opts.text,
      choices: [],
      map: {
        map_id: "japan_regions",
        regions: pins(...opts.pinIds),
      },
    },
    answer: { correct_ids: [opts.correctId] },
    explanation: { short: opts.explanation },
    curriculum_ref: {
      grade: 5,
      unit_number: 2,
      learning_point: opts.learningPoint,
    },
    hint: opts.hint,
    tags: opts.tags ?? ["稲作", "地図"],
  };
}

/** 米づくり・平野・農業機械など、農業分野の専用問題 */
export function buildIndustryAgricultureQuestions(): Question[] {
  let index = 0;

  const questions: Question[] = [
    // --- 平野の名前 ---
    mcQuestion(index++, {
      text: "日本でいちばん広い平野の名前はどれですか？",
      choices: ["関東平野", "濃尾平野", "庄内平野", "筑後平野"],
      correctIndex: 0,
      explanation:
        "関東平野は東京や埼玉など関東地方に広がる日本最大の平野で、米や野菜の生産がさかんです。",
      hint: "東京がある地方の大きな平野だよ。",
      difficulty: 1,
      learningPoint: "平野と稲作",
      tags: ["平野", "関東"],
    }),
    mcQuestion(index++, {
      text: "愛知県と三重県にまたがる、米どころとして有名な平野の名前はどれですか？",
      choices: ["濃尾平野", "関東平野", "越後平野", "仙台平野"],
      correctIndex: 0,
      explanation:
        "濃尾平野は木曽川や揖斐川の流域に広がり、米の生産がとてもさかんな平野です。",
      hint: "名古屋の近くにある平野だよ。",
      learningPoint: "平野と稲作",
      tags: ["平野", "濃尾"],
    }),
    mcQuestion(index++, {
      text: "山形県と新潟県にまたがる、米の生産がさかんな平野の名前はどれですか？",
      choices: ["庄内平野", "筑後平野", "関東平野", "大阪平野"],
      correctIndex: 0,
      explanation:
        "庄内平野は日本海側に広がり、水が豊富で米づくりが盛んな地域として知られています。",
      hint: "東北地方の日本海側にある平野だよ。",
      learningPoint: "平野と稲作",
      tags: ["平野", "庄内"],
    }),
    mcQuestion(index++, {
      text: "新潟県にある、米どころとして有名な平野の名前はどれですか？",
      choices: ["越後平野", "濃尾平野", "筑後平野", "関東平野"],
      correctIndex: 0,
      explanation:
        "越後平野は信濃川の流域に広がり、新潟県を中心に米の生産がさかんです。",
      hint: "新潟県にある平野の名前だよ。",
      learningPoint: "平野と稲作",
      tags: ["平野", "越後"],
    }),
    mcQuestion(index++, {
      text: "福岡県など九州北部に広がる、米どころの平野の名前はどれですか？",
      choices: ["筑後平野", "庄内平野", "濃尾平野", "仙台平野"],
      correctIndex: 0,
      explanation:
        "筑後平野は筑後川の流域に広がり、九州でも代表的な米の産地です。",
      hint: "九州の北部にある大きな平野だよ。",
      learningPoint: "平野と稲作",
      tags: ["平野", "筑後"],
    }),

    // --- 米づくりが盛んな地域の位置 ---
    mapPinQuestion(index++, {
      text: "日本最大の関東平野がある地方を地図でタップしよう。",
      correctId: "kanto",
      pinIds: ["kanto", "chubu", "tohoku", "kinki"],
      explanation:
        "関東地方には広い関東平野があり、米や野菜の生産が盛んです。",
      hint: "東京がある地方だよ。",
      difficulty: 1,
      learningPoint: "稲作地域",
    }),
    mapPinQuestion(index++, {
      text: "庄内平野や仙台平野など、米づくりがさかんな東北地方を地図でタップしよう。",
      correctId: "tohoku",
      pinIds: ["tohoku", "kanto", "chubu", "hokkaido"],
      explanation:
        "東北地方には広い平野が多く、水が豊富で米の生産が盛んな地域です。",
      hint: "北海道の南、本州の東のはじっこだよ。",
      learningPoint: "稲作地域",
    }),
    mapPinQuestion(index++, {
      text: "濃尾平野や越後平野など、米どころがある中部地方を地図でタップしよう。",
      correctId: "chubu",
      pinIds: ["chubu", "kinki", "kanto", "tohoku"],
      explanation:
        "中部地方には濃尾平野や越後平野など、米の生産がさかんな平野があります。",
      hint: "富士山があるあたりを含む地方だよ。",
      learningPoint: "稲作地域",
    }),
    mapPinQuestion(index++, {
      text: "筑後平野がある九州地方を地図でタップしよう。",
      correctId: "kyushu",
      pinIds: ["kyushu", "shikoku", "kinki", "chubu"],
      explanation:
        "九州地方には筑後平野などがあり、温暖な気候を生かした米づくりが行われています。",
      hint: "日本の南西にある大きな島だよ。",
      learningPoint: "稲作地域",
    }),

    // --- 米づくり地域の特徴 ---
    mcQuestion(index++, {
      text: "米づくりがさかんな地域の特徴として、最も適切なものはどれですか？",
      choices: [
        "広い平野に水をためて使える",
        "高い山だけが続く",
        "深い海だけがある",
        "砂漠が広がっている",
      ],
      correctIndex: 0,
      explanation:
        "米は田んぼで育てるため、広い平野と水が豊富な土地が適しています。",
      hint: "田んぼには何が必要か考えてみよう。",
      difficulty: 1,
      learningPoint: "稲作",
    }),
    mcQuestion(index++, {
      text: "東北地方が米どころとして知られる理由として、最も適切なものはどれですか？",
      choices: [
        "広い平野が多く、水が豊富だから",
        "一年中雪が降らないから",
        "海しかないから",
        "平野がまったくないから",
      ],
      correctIndex: 0,
      explanation:
        "東北地方には庄内平野や仙台平野など広い平野があり、米づくりに適した土地が広がっています。",
      hint: "庄内平野や仙台平野を思い出してみよう。",
      learningPoint: "稲作地域",
      tags: ["東北", "稲作"],
    }),

    // --- 農業機械 ---
    mcQuestion(index++, {
      text: "田んぼの土を耕したり、肥料をまいたりするのに使う農業の車両はどれですか？",
      choices: ["トラクター", "コンバイン", "漁船", "バス"],
      correctIndex: 0,
      explanation:
        "トラクターは農業用の車両で、田んぼの耕作や運搬などに使われます。",
      hint: "畑や田んぼでよく見かける、大きなタイヤの車だよ。",
      difficulty: 1,
      learningPoint: "農業機械",
      tags: ["農業機械", "トラクター"],
    }),
    mcQuestion(index++, {
      text: "苗をまとめて田んぼにうえるのに使う農業機械はどれですか？",
      choices: ["田植機", "コンバイン", "トラクター", "クレーン"],
      correctIndex: 0,
      explanation:
        "田植機は、稲の苗を効率よく田んぼに植えるための農業機械です。",
      hint: "春の田植えのときに使う機械だよ。",
      difficulty: 1,
      learningPoint: "農業機械",
      tags: ["農業機械", "田植機"],
    }),
    mcQuestion(index++, {
      text: "刈り取った稲から米をとりだすのに使う農業機械はどれですか？",
      choices: ["コンバイン", "田植機", "トラクター", "タクシー"],
      correctIndex: 0,
      explanation:
        "コンバインは稲を刈り取りながら米をとりだす機械で、秋の収穫のときに使われます。",
      hint: "秋の稲刈りのときに大きな音を立てて動く機械だよ。",
      difficulty: 1,
      learningPoint: "農業機械",
      tags: ["農業機械", "コンバイン"],
    }),
    mcQuestion(index++, {
      text: "米づくりの流れと、使う農業機械の組み合わせとして正しいものはどれですか？",
      choices: [
        "田植機で苗を植える → コンバインで収穫する",
        "コンバインで苗を植える → 田植機で収穫する",
        "トラクターだけで米をとりだす",
        "漁船で田んぼを耕す",
      ],
      correctIndex: 0,
      explanation:
        "春には田植機で苗を植え、秋にはコンバインで稲を刈り取って米をとりだします。",
      hint: "春と秋で使う機械がちがうよ。",
      difficulty: 2,
      learningPoint: "農業機械",
      tags: ["農業機械", "稲作"],
    }),
  ];

  return questions;
}
