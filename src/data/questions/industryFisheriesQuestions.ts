import type { Question } from "@/types/question";

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
    id: `ind_fish_extra_q${String(index + 1).padStart(3, "0")}`,
    unit_id: "industry-fisheries",
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
    tags: opts.tags ?? ["水産業"],
  };
}

/** 海流・排他的経済水域など、水産業分野の専用問題 */
export function buildIndustryFisheriesQuestions(): Question[] {
  let index = 0;

  const questions: Question[] = [
    // --- 海流の基礎 ---
    mcQuestion(index++, {
      text: "海流とは、どのようなものですか？",
      choices: [
        "海の水が大きく流れていること",
        "海の底に沈んだ岩のこと",
        "海に浮かぶ氷のこと",
        "海の色が変わること",
      ],
      correctIndex: 0,
      explanation:
        "海流は、風や地球の自転などの影響で、海の水が大きく流れることです。",
      hint: "川の流れのように、海の水も動いているよ。",
      difficulty: 1,
      learningPoint: "海流",
      tags: ["海流"],
    }),
    mcQuestion(index++, {
      text: "日本の太平洋側を流れる、暖かい海流の名前はどれですか？",
      choices: ["黒潮", "親潮", "日本海流", "赤道海流"],
      correctIndex: 0,
      explanation:
        "黒潮は暖かい海流で、本州の太平洋側を南から北へ流れ、魚の回遊路として知られています。",
      hint: "「くろしお」と読む、日本でいちばん有名な暖流だよ。",
      difficulty: 1,
      learningPoint: "海流",
      tags: ["海流", "黒潮"],
    }),
    mcQuestion(index++, {
      text: "北海道の太平洋側などを流れる、冷たい海流の名前はどれですか？",
      choices: ["親潮", "黒潮", "対馬海流", "南海海流"],
      correctIndex: 0,
      explanation:
        "親潮は冷たい海流で、栄養分をたくさん含んだ水を運び、漁場づくりに関わっています。",
      hint: "黒潮とはちがう、冷たい方の海流だよ。",
      difficulty: 2,
      learningPoint: "海流",
      tags: ["海流", "親潮"],
    }),
    mcQuestion(index++, {
      text: "黒潮の特徴として、最も適切なものはどれですか？",
      choices: [
        "暖かく、多くの魚が回遊する",
        "いつも氷でおおわれている",
        "海の水がまったく動かない",
        "淡水だけが流れる",
      ],
      correctIndex: 0,
      explanation:
        "黒潮は暖かい海流のため、マグロやサバなど多くの魚が回遊し、漁業にとって大切な海です。",
      hint: "暖かい海には、どんな魚がいそうか考えてみよう。",
      learningPoint: "海流",
      tags: ["海流", "黒潮"],
    }),
    mcQuestion(index++, {
      text: "黒潮と親潮が出会う海域で、漁がさかんになる主な理由はどれですか？",
      choices: [
        "栄養分が豊富で魚が集まりやすいから",
        "海の水がまったく動かないから",
        "船が進めなくなるから",
        "魚がまったくいなくなるから",
      ],
      correctIndex: 0,
      explanation:
        "暖かい黒潮と冷たい親潮が出会うと、海の中で栄養分が豊かになり、サンマやサケなどの良い漁場ができます。",
      hint: "暖かい流れと冷たい流れがぶつかると、海の生き物にとって良い場所になるよ。",
      difficulty: 2,
      learningPoint: "海流",
      tags: ["海流", "漁場"],
    }),
    mcQuestion(index++, {
      text: "黒潮が主に流れているのは、日本のどちら側の海ですか？",
      choices: ["太平洋側", "日本海側", "内陸の湖", "山の頂上"],
      correctIndex: 0,
      explanation:
        "黒潮は本州の東側、太平洋に面した海を流れる暖かい海流です。",
      hint: "東京や大阪の東側にある大きな海を思い出してみよう。",
      difficulty: 1,
      learningPoint: "海流",
      tags: ["海流", "黒潮"],
    }),
    mcQuestion(index++, {
      text: "海流が漁業にもたらす役割として、最も適切なものはどれですか？",
      choices: [
        "魚が集まる漁場をつくる",
        "海の水をなくす",
        "船を動かせなくする",
        "魚を海から消す",
      ],
      correctIndex: 0,
      explanation:
        "海流は魚の移動の道になり、栄養分を運ぶため、どこで漁がさかんかを知るうえで大切です。",
      hint: "魚は海流にのって移動することが多いよ。",
      learningPoint: "海流",
      tags: ["海流", "漁業"],
    }),

    // --- 排他的経済水域 ---
    mcQuestion(index++, {
      text: "「排他的経済水域」を英語の略称でいうと、どれですか？",
      choices: ["EEZ", "GPS", "JR", "NHK"],
      correctIndex: 0,
      explanation:
        "排他的経済水域は Exclusive Economic Zone の略で EEZ と呼ばれます。",
      hint: "英語の頭文字をとった3文字だよ。",
      difficulty: 1,
      learningPoint: "排他的経済水域",
      tags: ["排他的経済水域", "EEZ"],
    }),
    mcQuestion(index++, {
      text: "排他的経済水域の範囲として、正しいものはどれですか？",
      choices: [
        "沿岸からおおよそ200海里（約370km）の海域",
        "沿岸から1kmの海域だけ",
        "日本全国の陸地だけ",
        "外国の海もすべて含む",
      ],
      correctIndex: 0,
      explanation:
        "各国は沿岸からおおよそ200海里（約370km）までの海域を排他的経済水域として管理できます。",
      hint: "とても広い範囲の海が対象だよ。",
      difficulty: 2,
      learningPoint: "排他的経済水域",
      tags: ["排他的経済水域"],
    }),
    mcQuestion(index++, {
      text: "排他的経済水域で、国が行えることとして正しいものはどれですか？",
      choices: [
        "漁業や海底の資源開発を管理する",
        "他国の領土を自由に支配する",
        "海をなくして陸地にする",
        "すべての船の通行を禁止する",
      ],
      correctIndex: 0,
      explanation:
        "排他的経済水域では、漁業や海底資源の開発などをその国が管理し、大切に活用します。",
      hint: "海の資源や漁業に関することだよ。",
      learningPoint: "排他的経済水域",
      tags: ["排他的経済水域"],
    }),
    mcQuestion(index++, {
      text: "日本の排他的経済水域の特徴として、正しいものはどれですか？",
      choices: [
        "島国のため、世界でも広い範囲を持つ",
        "世界でいちばん狭い",
        "日本にはまったくない",
        "陸地だけで海は含まない",
      ],
      correctIndex: 0,
      explanation:
        "日本は四方を海に囲まれた島国で、排他的経済水域の面積は世界でも上位にあります。",
      hint: "日本は島国だよね。海は広いかな？",
      difficulty: 2,
      learningPoint: "排他的経済水域",
      tags: ["排他的経済水域", "日本"],
    }),
    mcQuestion(index++, {
      text: "排他的経済水域が漁業にとって大切な理由として、最も適切なものはどれですか？",
      choices: [
        "日本の海で漁業を行う権利を守れるから",
        "海の魚がすべてなくなるから",
        "外国の魚だけをとれるから",
        "漁師の仕事がなくなるから",
      ],
      correctIndex: 0,
      explanation:
        "排他的経済水域を定めることで、日本の海の漁業資源を大切に守りながら活用できます。",
      hint: "日本の海で、日本の漁師が漁をするために必要なルールだよ。",
      learningPoint: "排他的経済水域",
      tags: ["排他的経済水域", "漁業"],
    }),
    mcQuestion(index++, {
      text: "領海と排他的経済水域のちがいとして、正しいものはどれですか？",
      choices: [
        "領海は国の領土の一部、排他的経済水域は漁業などを管理する海域",
        "どちらもまったく同じ意味",
        "領海は外国だけが使える",
        "排他的経済水域は陸地のこと",
      ],
      correctIndex: 0,
      explanation:
        "領海は国の領土の一部ですが、排他的経済水域は領海の外側で、漁業や資源開発を管理する海域です。",
      hint: "領海はもっと沿岸に近く、排他的経済水域はもっと広いよ。",
      difficulty: 3,
      learningPoint: "排他的経済水域",
      tags: ["排他的経済水域", "領海"],
    }),
  ];

  return questions;
}
