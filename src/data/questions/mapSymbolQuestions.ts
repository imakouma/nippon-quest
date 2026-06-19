import type { Question } from "@/types/question";

const SYM = (file: string) => `/maps/map-symbols/${file}`;

interface MapSymbolItem {
  image: string;
  label: string;
  questionText: string;
  correct: string;
  distractors: [string, string, string];
  hint: string;
  explanation: string;
  learningPoint: string;
  difficulty?: 1 | 2;
}

const MAP_SYMBOL_ITEMS: MapSymbolItem[] = [
  {
    image: SYM("f0d3eb02d937421f8bf4476734bfae1c.webp"),
    label: "市役所",
    questionText: "地図記号を見て。この記号が示す施設はどれですか？",
    correct: "市役所・区役所",
    distractors: ["図書館", "郵便局", "裁判所"],
    hint: "二重の丸い記号だよ。町の用事をする場所を思い出そう。",
    explanation:
      "二重丸の記号は市役所や区役所を表します。市民のための役所です。",
    learningPoint: "市役所",
  },
  {
    image: SYM("315e5dd0324265086954b1d22979828e.png"),
    label: "町村役場",
    questionText: "地図記号を見て。この記号が示す施設はどれですか？",
    correct: "町村役場・区役所",
    distractors: ["市役所", "交番", "郵便局"],
    hint: "丸に縦線が入った記号だよ。町や村の役場を表すよ。",
    explanation:
      "丸の中に縦線がある記号は、町村役場や政令指定都市の区役所を表します。",
    learningPoint: "町村役場",
    difficulty: 2,
  },
  {
    image: SYM("e50d5650050ff81c02894835b28f3701.webp"),
    label: "図書館",
    questionText: "地図記号を見て。この記号が示す施設はどれですか？",
    correct: "図書館",
    distractors: ["博物館", "学校", "郵便局"],
    hint: "本を読んだり借りたりする場所だよ。",
    explanation:
      "開いた本の形の記号は図書館を表します。本を読んだり借りたりできます。",
    learningPoint: "図書館",
  },
  {
    image: SYM("8e73f7671022b60f8d36f23543414554.webp"),
    label: "博物館",
    questionText: "地図記号を見て。この記号が示す施設はどれですか？",
    correct: "博物館",
    distractors: ["図書館", "美術館", "学校"],
    hint: "丸い屋根の建物の記号だよ。学びの施設を考えてみよう。",
    explanation:
      "丸いドームのような記号は博物館を表します。資料や展示を見学できます。",
    learningPoint: "博物館",
    difficulty: 2,
  },
  {
    image: SYM("5e628cf8961579607f965fdb6390339f.webp"),
    label: "学校",
    questionText: "地図記号を見て。この記号が示す施設はどれですか？",
    correct: "小学校・中学校",
    distractors: ["高等学校", "図書館", "保育園"],
    hint: "子どもたちが毎日通う場所だよ。",
    explanation:
      "校章のような記号は小学校や中学校を表します。",
    learningPoint: "学校",
  },
  {
    image: SYM("983bcb32c4463b82990b4b2d13101aee.webp"),
    label: "高等学校",
    questionText: "地図記号を見て。この記号が示す施設はどれですか？",
    correct: "高等学校",
    distractors: ["小学校・中学校", "大学", "図書館"],
    hint: "中学校の次に進む学校だよ。",
    explanation:
      "帽子の形をした記号は高等学校を表します。",
    learningPoint: "高等学校",
    difficulty: 2,
  },
  {
    image: SYM("93577ce8593450804848162becf1bed7.webp"),
    label: "郵便局",
    questionText: "地図記号を見て。この記号が示す施設はどれですか？",
    correct: "郵便局",
    distractors: ["銀行", "市役所", "図書館"],
    hint: "手紙や荷物を出す場所だよ。",
    explanation: "〒のマークは郵便局を表します。",
    learningPoint: "郵便局",
  },
  {
    image: SYM("b5d2826d89581647cd2a2af5df02bc96.webp"),
    label: "病院",
    questionText: "地図記号を見て。この記号が示す施設はどれですか？",
    correct: "病院",
    distractors: ["消防署", "警察署", "老人ホーム"],
    hint: "けがや病気のときに行く場所だよ。",
    explanation: "十字の記号は病院を表します。",
    learningPoint: "病院",
  },
  {
    image: SYM("fb61fc04b63ab98926f6f597ba4993ed.webp"),
    label: "警察署",
    questionText: "地図記号を見て。この記号が示す施設はどれですか？",
    correct: "警察署",
    distractors: ["交番", "消防署", "裁判所"],
    hint: "丸の中に×がある記号だよ。町の安全を守る場所だよ。",
    explanation: "丸の中に×がある記号は警察署を表します。",
    learningPoint: "警察署",
  },
  {
    image: SYM("b6ebb1452a4067e80c0a2ca6e3154f73.png.webp"),
    label: "交番",
    questionText: "地図記号を見て。この記号が示す施設はどれですか？",
    correct: "交番",
    distractors: ["警察署", "消防署", "市役所"],
    hint: "×だけの記号だよ。警察署より小さなまちの安全を守る場所だよ。",
    explanation:
      "×の記号は交番を表します。地域の安全を守る小さな警察の施設です。",
    learningPoint: "交番",
    difficulty: 2,
  },
  {
    image: SYM("ed371c867925ae717e9766e9898340ee.webp"),
    label: "消防署",
    questionText: "地図記号を見て。この記号が示す施設はどれですか？",
    correct: "消防署",
    distractors: ["警察署", "病院", "交番"],
    hint: "火事のときに助けてくれる場所だよ。",
    explanation: "消防署の記号は、火事や救助のための施設を表します。",
    learningPoint: "消防署",
  },
  {
    image: SYM("000241206.png"),
    label: "裁判所",
    questionText: "地図記号を見て。この記号が示す施設はどれですか？",
    correct: "裁判所",
    distractors: ["警察署", "市役所", "消防署"],
    hint: "さんかく形の上に棒がある記号だよ。",
    explanation:
      "さんかく形の記号は裁判所を表します。法律に基づいて裁判を行う場所です。",
    learningPoint: "裁判所",
    difficulty: 2,
  },
  {
    image: SYM("b4d2b4197b47d822ba2d108759fa516e.webp"),
    label: "老人ホーム",
    questionText: "地図記号を見て。この記号が示す施設はどれですか？",
    correct: "老人ホーム",
    distractors: ["病院", "図書館", "温泉"],
    hint: "お年寄りが生活する施設だよ。",
    explanation:
      "家の形に丸がある記号は老人ホームを表します。高齢者の生活を支える施設です。",
    learningPoint: "老人ホーム",
    difficulty: 2,
  },
  {
    image: SYM("1e5c1371810e09992c2e98b626151b5d.webp"),
    label: "神社",
    questionText: "地図記号を見て。この記号が示す施設はどれですか？",
    correct: "神社",
    distractors: ["寺院", "教会", "博物館"],
    hint: "鳥居の形をした記号だよ。",
    explanation: "鳥居の形の記号は神社を表します。",
    learningPoint: "神社",
    difficulty: 2,
  },
  {
    image: SYM("d6a39db4401cc0b073973908f74b60fb.webp"),
    label: "寺院",
    questionText: "地図記号を見て。この記号が示す施設はどれですか？",
    correct: "寺院",
    distractors: ["神社", "教会", "博物館"],
    hint: "仏教のお寺を表す記号だよ。",
    explanation: "卍（まんじ）の形の記号は寺院を表します。",
    learningPoint: "寺院",
    difficulty: 2,
  },
  {
    image: SYM("00cc0137ff85a3fbe0dece7fc83bff36.webp"),
    label: "温泉",
    questionText: "地図記号を見て。この記号が示すものはどれですか？",
    correct: "温泉",
    distractors: ["港湾", "発電所", "風車"],
    hint: "お湯がわいている場所だよ。",
    explanation:
      "湯気のような記号は温泉を表します。温泉地や温泉施設があることを示します。",
    learningPoint: "温泉",
    difficulty: 2,
  },
  {
    image: SYM("698f5eaf4cbe26442a7c2e6e2d0db9d4.webp"),
    label: "風車",
    questionText: "地図記号を見て。この記号が示すものはどれですか？",
    correct: "風車",
    distractors: ["発電所", "港湾", "温泉"],
    hint: "くるくる回る羽の形だよ。",
    explanation:
      "羽の形をした記号は風車を表します。風力発電などに使われる施設です。",
    learningPoint: "風車",
    difficulty: 2,
  },
  {
    image: SYM("6035c81befcf6e72b5920b00458200eb.webp"),
    label: "発電所",
    questionText: "地図記号を見て。この記号が示すものはどれですか？",
    correct: "発電所",
    distractors: ["風車", "港湾", "温泉"],
    hint: "電気をつくる施設や、電線を表すよ。",
    explanation:
      "電柱と電線の記号は発電所や送電線を表します。電気を運ぶ設備です。",
    learningPoint: "発電所",
    difficulty: 2,
  },
  {
    image: SYM("3db5087bec1fa5638957f6b21daaf797.webp"),
    label: "田",
    questionText: "地図記号を見て。この記号が示すものはどれですか？",
    correct: "田んぼ",
    distractors: ["畑", "茶畑", "果樹園"],
    hint: "お米を育てる水たまりのある場所だよ。",
    explanation: "田んぼ（水田）を表す記号です。",
    learningPoint: "田",
  },
  {
    image: SYM("4efd6fed1ab88939e70760b584ec3cc8.webp"),
    label: "畑",
    questionText: "地図記号を見て。この記号が示すものはどれですか？",
    correct: "畑",
    distractors: ["田んぼ", "茶畑", "果樹園"],
    hint: "野菜や小麦などを育てる農地だよ。",
    explanation: "下向きの角の記号は畑（畑地）を表します。",
    learningPoint: "畑",
  },
  {
    image: SYM("12a66f482814cf1c14e2f22af4531a42.webp"),
    label: "果樹園",
    questionText: "地図記号を見て。この記号が示すものはどれですか？",
    correct: "果樹園",
    distractors: ["畑", "茶畑", "広葉樹林"],
    hint: "りんごやみかんなどの木を育てる場所だよ。",
    explanation:
      "丸い木が並んだ記号は果樹園を表します。果物をとる木が植えられています。",
    learningPoint: "果樹園",
    difficulty: 2,
  },
  {
    image: SYM("1146934a6d52209115b8151f8d659b2c.webp"),
    label: "広葉樹林",
    questionText: "地図記号を見て。この記号が示すものはどれですか？",
    correct: "広葉樹林",
    distractors: ["針葉樹林", "果樹園", "畑"],
    hint: "広い葉っぱの木がある森だよ。",
    explanation:
      "丸い木の記号は広葉樹林を表します。クヌギやコナラなど広い葉の木の森です。",
    learningPoint: "広葉樹林",
    difficulty: 2,
  },
  {
    image: SYM("ddb448db82e290a08026d3799c17f50c.png"),
    label: "針葉樹林",
    questionText: "地図記号を見て。この記号が示すものはどれですか？",
    correct: "針葉樹林",
    distractors: ["広葉樹林", "果樹園", "畑"],
    hint: "とがった葉の木がある森だよ。",
    explanation:
      "さんかく形の木の記号は針葉樹林を表します。スギやヒノキなどの森です。",
    learningPoint: "針葉樹林",
    difficulty: 2,
  },
  {
    image: SYM("000243019.png"),
    label: "駅（JR）",
    questionText: "地図記号を見て。この記号が示す施設はどれですか？",
    correct: "JR線の駅",
    distractors: ["JR線以外の駅", "バス停", "港湾"],
    hint: "線の上に白い四角があるよ。JRの駅だよ。",
    explanation:
      "線の上に白い四角がある記号は、JR線の駅を表します。",
    learningPoint: "駅（JR）",
    difficulty: 2,
  },
  {
    image: SYM("caa9df9ea34c835718efdaeb039f9ae0.webp"),
    label: "JR線（単線）",
    questionText: "地図記号を見て。この記号が示すものはどれですか？",
    correct: "JR線（単線）",
    distractors: ["JR線以外（単線）", "JR線（複線）", "国道"],
    hint: "1本の線で、白と黒が交互だよ。",
    explanation:
      "白と黒が交互の1本線は、JR線の単線（線路が1本）を表します。",
    learningPoint: "JR線",
    difficulty: 2,
  },
  {
    image: SYM("000241158.png"),
    label: "JR線以外（単線）",
    questionText: "地図記号を見て。この記号が示すものはどれですか？",
    correct: "JR線以外の鉄道（単線）",
    distractors: ["JR線（単線）", "JR線（複線）", "国道"],
    hint: "1本の線で、黒い線だよ。私鉄などの線路だよ。",
    explanation:
      "黒い1本線は、JR線以外の鉄道の単線を表します。",
    learningPoint: "私鉄線",
    difficulty: 2,
  },
];

function buildQuestion(item: MapSymbolItem, index: number): Question {
  return {
    id: `map_symbols_q${String(index + 1).padStart(3, "0")}`,
    unit_id: "map_symbols",
    type: "multiple_choice",
    difficulty: item.difficulty ?? 1,
    question: {
      text: item.questionText,
      image_url: item.image,
      choices: [
        { id: "a", text: item.correct },
        { id: "b", text: item.distractors[0] },
        { id: "c", text: item.distractors[1] },
        { id: "d", text: item.distractors[2] },
      ],
    },
    answer: { correct_ids: ["a"] },
    explanation: { short: item.explanation },
    curriculum_ref: {
      grade: 3,
      unit_number: 1,
      learning_point: `地図記号・${item.learningPoint}`,
    },
    hint: item.hint,
    tags: ["地図記号"],
  };
}

/** tizukigou 画像を使った地図記号問題（全26問） */
export function buildMapSymbolQuestions(): Question[] {
  return MAP_SYMBOL_ITEMS.map(buildQuestion);
}
