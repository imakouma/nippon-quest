import type { Question } from "@/types/question";
import type { HistoryQuizUnitId } from "@/data/historyModes";

interface SortQuestionOpts {
  text: string;
  items: { id: string; text: string }[];
  explanation: string;
  detail?: string;
  hint: string;
  difficulty?: 1 | 2 | 3;
  learningPoint: string;
  tags?: string[];
}

function sortQuestion(
  modeId: HistoryQuizUnitId,
  index: number,
  opts: SortQuestionOpts,
): Question {
  const correctIds = opts.items.map((i) => i.id);
  return {
    id: `${modeId}_timeline_q${String(index + 1).padStart(3, "0")}`,
    unit_id: modeId,
    type: "sort_order",
    difficulty: opts.difficulty ?? 2,
    question: {
      text: opts.text,
      choices: [],
      sort_items: opts.items,
    },
    answer: { correct_ids: correctIds },
    explanation: {
      short: opts.explanation,
      detail: opts.detail ?? "年表を使うと、歴史の流れを整理できます。",
    },
    curriculum_ref: {
      grade: 6,
      unit_number: 2,
      learning_point: opts.learningPoint,
    },
    hint: opts.hint,
    tags: opts.tags ?? ["歴史", "年表", "並べ替え"],
  };
}

const ERA = {
  jomon: { id: "e1", text: "縄文時代" },
  yayoi: { id: "e2", text: "弥生時代" },
  kofun: { id: "e3", text: "古墳時代" },
  asuka: { id: "e4", text: "飛鳥時代" },
  nara: { id: "e5", text: "奈良時代" },
  heian: { id: "e6", text: "平安時代" },
  kamakura: { id: "e7", text: "鎌倉時代" },
  muromachi: { id: "e8", text: "室町時代" },
  sengoku: { id: "e9", text: "戦国時代" },
  azuchi: { id: "e10", text: "安土桃山時代" },
  edo: { id: "e11", text: "江戸時代" },
  meiji: { id: "e12", text: "明治時代" },
  taisho: { id: "e13", text: "大正時代" },
  showaPw: { id: "e14", text: "昭和時代（戦前）" },
  showaPo: { id: "e15", text: "昭和時代（戦後）" },
} as const;

type EraKey = keyof typeof ERA;

function eras(...keys: EraKey[]) {
  return keys.map((k) => ERA[k]);
}

const PER_UNIT_TIMELINE: Partial<
  Record<HistoryQuizUnitId, (modeId: HistoryQuizUnitId) => Question[]>
> = {
  "history-jomon": (id) => [
    sortQuestion(id, 0, {
      text: "次の時代を古い順に並べ替えよう。",
      items: eras("jomon", "yayoi", "kofun", "asuka"),
      explanation:
        "縄文→弥生→古墳→飛鳥の順が、日本の古代の大きな流れです。",
      hint: "いま学んでいる縄文時代がいちばん古いよ。",
      difficulty: 1,
      learningPoint: "時代区分",
    }),
  ],
  "history-yayoi": (id) => [
    sortQuestion(id, 0, {
      text: "次の時代を古い順に並べ替えよう。",
      items: eras("jomon", "yayoi", "kofun", "asuka"),
      explanation:
        "縄文→弥生→古墳→飛鳥の順が、日本の古代の大きな流れです。",
      hint: "弥生時代の前は縄文時代だよ。",
      difficulty: 1,
      learningPoint: "時代区分",
    }),
  ],
  "history-kofun": (id) => [
    sortQuestion(id, 0, {
      text: "次の時代を古い順に並べ替えよう。",
      items: eras("jomon", "yayoi", "kofun", "asuka"),
      explanation:
        "縄文→弥生→古墳→飛鳥の順が、日本の古代の大きな流れです。",
      hint: "古墳時代のあとに飛鳥時代が来るよ。",
      difficulty: 1,
      learningPoint: "時代区分",
    }),
  ],
  "history-asuka": (id) => [
    sortQuestion(id, 0, {
      text: "次の時代を古い順に並べ替えよう。",
      items: eras("kofun", "asuka", "nara", "heian"),
      explanation:
        "古墳→飛鳥→奈良→平安の順で、律令国家と貴族文化へと進みました。",
      hint: "飛鳥時代のあとに奈良時代が来るよ。",
      difficulty: 2,
      learningPoint: "時代区分",
    }),
  ],
  "history-nara": (id) => [
    sortQuestion(id, 0, {
      text: "次の時代を古い順に並べ替えよう。",
      items: eras("asuka", "nara", "heian", "kamakura"),
      explanation:
        "飛鳥→奈良→平安→鎌倉の順で、貴族の政治から武士の政治へ変わりました。",
      hint: "奈良時代のあとに平安時代が来るよ。",
      difficulty: 2,
      learningPoint: "時代区分",
    }),
  ],
  "history-heian": (id) => [
    sortQuestion(id, 0, {
      text: "次の時代を古い順に並べ替えよう。",
      items: eras("nara", "heian", "kamakura", "muromachi"),
      explanation:
        "奈良→平安→鎌倉→室町の順で、貴族文化から武士の政治へ進みました。",
      hint: "平安時代のあとに鎌倉時代が来るよ。",
      difficulty: 2,
      learningPoint: "時代区分",
    }),
  ],
  "history-kamakura": (id) => [
    sortQuestion(id, 0, {
      text: "次の時代を古い順に並べ替えよう。",
      items: eras("heian", "kamakura", "muromachi", "sengoku"),
      explanation:
        "平安→鎌倉→室町→戦国の順で、武士の政治が続き、やがて戦国の争いへ進みました。",
      hint: "鎌倉時代のあとに室町時代が来るよ。",
      difficulty: 2,
      learningPoint: "時代区分",
    }),
    sortQuestion(id, 1, {
      text: "次の出来事を古い順に並べ替えよう。",
      items: [
        { id: "ev1", text: "平治の乱" },
        { id: "ev2", text: "壇ノ浦の戦い" },
        { id: "ev3", text: "承久の乱" },
        { id: "ev4", text: "元寇" },
      ],
      explanation:
        "平治の乱（1159年）→ 壇ノ浦の戦い（1185年）→ 承久の乱（1221年）→ 元寇（1274・1281年）の順です。",
      hint: "鎌倉幕府ができる前の乱から順に考えてみよう。",
      difficulty: 2,
      learningPoint: "鎌倉時代",
      tags: ["鎌倉時代", "年表", "並べ替え"],
    }),
  ],
  "history-muromachi": (id) => [
    sortQuestion(id, 0, {
      text: "次の時代を古い順に並べ替えよう。",
      items: eras("kamakura", "muromachi", "sengoku", "azuchi"),
      explanation:
        "鎌倉→室町→戦国→安土桃山の順で、武士の政治から天下統一へ進みました。",
      hint: "室町時代のあとに戦国時代が来るよ。",
      difficulty: 2,
      learningPoint: "時代区分",
    }),
  ],
  "history-sengoku": (id) => [
    sortQuestion(id, 0, {
      text: "次の時代を古い順に並べ替えよう。",
      items: eras("muromachi", "sengoku", "azuchi", "edo"),
      explanation:
        "室町→戦国→安土桃山→江戸の順で、争いの時代から統一と江戸幕府へ進みました。",
      hint: "戦国時代のあとに安土桃山時代が来るよ。",
      difficulty: 2,
      learningPoint: "時代区分",
    }),
  ],
  "history-azuchi-momoyama": (id) => [
    sortQuestion(id, 0, {
      text: "次の時代を古い順に並べ替えよう。",
      items: eras("sengoku", "azuchi", "edo", "meiji"),
      explanation:
        "戦国→安土桃山→江戸→明治の順で、天下統一から近代国家のはじまりへ進みました。",
      hint: "安土桃山時代のあとに江戸時代が来るよ。",
      difficulty: 2,
      learningPoint: "時代区分",
    }),
  ],
  "history-edo": (id) => [
    sortQuestion(id, 0, {
      text: "次の時代を古い順に並べ替えよう。",
      items: eras("azuchi", "edo", "meiji", "taisho"),
      explanation:
        "安土桃山→江戸→明治→大正の順で、幕府の政治から近代へ進みました。",
      hint: "江戸時代のあとに明治時代が来るよ。",
      difficulty: 2,
      learningPoint: "時代区分",
    }),
  ],
  "history-meiji": (id) => [
    sortQuestion(id, 0, {
      text: "次の時代を古い順に並べ替えよう。",
      items: eras("edo", "meiji", "taisho", "showaPw"),
      explanation:
        "江戸→明治→大正→昭和（戦前）の順で、近代国家から戦前の時代へ進みました。",
      hint: "明治時代のあとに大正時代が来るよ。",
      difficulty: 2,
      learningPoint: "時代区分",
    }),
  ],
  "history-taisho": (id) => [
    sortQuestion(id, 0, {
      text: "次の時代を古い順に並べ替えよう。",
      items: eras("meiji", "taisho", "showaPw", "showaPo"),
      explanation:
        "明治→大正→昭和（戦前）→昭和（戦後）の順が、近代から戦後への流れです。",
      hint: "大正時代のあとに昭和時代（戦前）が来るよ。",
      difficulty: 2,
      learningPoint: "時代区分",
    }),
  ],
  "history-showa-prewar": (id) => [
    sortQuestion(id, 0, {
      text: "次の時代を古い順に並べ替えよう。",
      items: eras("meiji", "taisho", "showaPw", "showaPo"),
      explanation:
        "明治→大正→昭和（戦前）→昭和（戦後）の順が、近代から戦後への流れです。",
      hint: "昭和時代（戦前）のあとに戦後の時代が来るよ。",
      difficulty: 2,
      learningPoint: "時代区分",
    }),
  ],
  "history-showa-postwar": (id) => [
    sortQuestion(id, 0, {
      text: "次の時代を古い順に並べ替えよう。",
      items: eras("meiji", "taisho", "showaPw", "showaPo"),
      explanation:
        "明治→大正→昭和（戦前）→昭和（戦後）の順が、近代から戦後への流れです。",
      hint: "いま学んでいる昭和（戦後）がいちばん新しい時代だよ。",
      difficulty: 2,
      learningPoint: "時代区分",
    }),
  ],
};

function buildDedicatedTimelineQuestions(
  modeId: HistoryQuizUnitId,
): Question[] {
  return [
    sortQuestion(modeId, 0, {
      text: "次の時代を古い順に並べ替えよう。",
      items: eras("jomon", "yayoi", "kofun", "asuka"),
      explanation:
        "縄文→弥生→古墳→飛鳥の順が、日本の古代の大きな流れです。",
      hint: "縄文時代がいちばん古いよ。",
      difficulty: 1,
      learningPoint: "時代区分",
    }),
    sortQuestion(modeId, 1, {
      text: "次の時代を古い順に並べ替えよう。",
      items: eras("nara", "heian", "kamakura", "muromachi"),
      explanation:
        "奈良→平安→鎌倉→室町の順で、律令国家から武士の政治へ進みました。",
      hint: "奈良時代がこの中でいちばん古いよ。",
      difficulty: 2,
      learningPoint: "時代区分",
    }),
    sortQuestion(modeId, 2, {
      text: "次の時代を古い順に並べ替えよう。",
      items: eras("sengoku", "azuchi", "edo", "meiji"),
      explanation:
        "戦国→安土桃山→江戸→明治の順で、争いの時代から近代国家へ進みました。",
      hint: "戦国時代がこの中でいちばん古いよ。",
      difficulty: 2,
      learningPoint: "時代区分",
    }),
    sortQuestion(modeId, 3, {
      text: "次の時代を古い順に並べ替えよう。",
      items: eras("meiji", "taisho", "showaPw", "showaPo"),
      explanation:
        "明治→大正→昭和（戦前）→昭和（戦後）の順が、近代から戦後への流れです。",
      hint: "明治時代がこの中でいちばん古いよ。",
      difficulty: 2,
      learningPoint: "時代区分",
    }),
    sortQuestion(modeId, 4, {
      text: "次の出来事を古い順に並べ替えよう。",
      items: [
        { id: "ev1", text: "大化の改新" },
        { id: "ev2", text: "鎌倉幕府の成立" },
        { id: "ev3", text: "江戸幕府の開幕" },
        { id: "ev4", text: "明治維新" },
      ],
      explanation:
        "大化の改新（645年）→ 鎌倉幕府（1185年）→ 江戸幕府（1603年）→ 明治維新（1868年）の順です。",
      hint: "大化の改新がいちばん古い出来事だよ。",
      difficulty: 2,
      learningPoint: "時代区分",
    }),
    sortQuestion(modeId, 5, {
      text: "次の時代を古い順に並べ替えよう。",
      items: eras("jomon", "yayoi", "kofun", "asuka", "nara", "heian"),
      explanation:
        "縄文から平安まで、古代の時代がこの順に続きました。",
      hint: "6つの時代のうち、縄文時代がいちばん古いよ。",
      difficulty: 3,
      learningPoint: "時代区分",
    }),
  ];
}

export function buildHistoryTimelineQuestionsByMode(): Record<
  HistoryQuizUnitId,
  Question[]
> {
  const result = {} as Record<HistoryQuizUnitId, Question[]>;

  for (const [modeId, builder] of Object.entries(PER_UNIT_TIMELINE)) {
    result[modeId as HistoryQuizUnitId] = builder(modeId as HistoryQuizUnitId);
  }

  result["history-timeline"] = buildDedicatedTimelineQuestions("history-timeline");

  return result;
}
