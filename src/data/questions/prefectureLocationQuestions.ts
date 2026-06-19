import type { Question } from "@/types/question";
import { JAPAN_PIN } from "@/data/maps/japanPinCoords";

type PinId = keyof typeof JAPAN_PIN;
type RegionMapId = "japan_prefectures" | "japan_islands" | "japan_regions";

function pins(...ids: PinId[]) {
  return ids.map((id) => JAPAN_PIN[id]);
}

function mapPinQuestion(
  index: number,
  opts: {
    text: string;
    correctId: PinId;
    pinIds: PinId[];
    mapId: RegionMapId;
    explanation: string;
    hint: string;
    difficulty?: 1 | 2;
    learningPoint?: string;
    tags?: string[];
  },
): Question {
  return {
    id: `pref_loc_q${String(index + 1).padStart(3, "0")}`,
    unit_id: "prefectures-location",
    type: "map_pin",
    difficulty: opts.difficulty ?? 1,
    question: {
      text: opts.text,
      choices: [],
      map: {
        map_id: opts.mapId,
        regions: pins(...opts.pinIds),
      },
    },
    answer: { correct_ids: [opts.correctId] },
    explanation: { short: opts.explanation },
    curriculum_ref: {
      grade: 4,
      unit_number: 1,
      learning_point: opts.learningPoint ?? "位置",
    },
    hint: opts.hint,
    tags: opts.tags ?? ["地図", "都道府県"],
  };
}

/** 地方色分け地図・島地図に沿った「位置」問題 */
export function buildPrefectureLocationQuestions(): Question[] {
  const mapQuestions: Question[] = [
    mapPinQuestion(0, {
      text: "日本地図で「北海道」の位置をタップしよう。",
      correctId: "hokkaido",
      pinIds: ["hokkaido", "tohoku", "kanto", "kyushu"],
      mapId: "japan_prefectures",
      explanation:
        "北海道は日本の最北にある大きな島で、道庁所在地は札幌市です。",
      hint: "日本でいちばん北にある大きな島だよ。",
    }),
    mapPinQuestion(1, {
      text: "日本地図で「東北」の位置をタップしよう。",
      correctId: "tohoku",
      pinIds: ["hokkaido", "tohoku", "kanto", "chubu"],
      mapId: "japan_prefectures",
      explanation:
        "東北地方は本州の北東部にあり、青森・宮城・福島など6県があります。",
      hint: "北海道の南、本州の東のはじっこだよ。",
    }),
    mapPinQuestion(2, {
      text: "日本地図で「関東」の位置をタップしよう。",
      correctId: "kanto",
      pinIds: ["tohoku", "kanto", "chubu", "kinki"],
      mapId: "japan_prefectures",
      explanation:
        "関東地方は本州の中央部にあり、東京・神奈川・埼玉などの都県があります。",
      hint: "東京がある地方だよ。",
    }),
    mapPinQuestion(3, {
      text: "日本地図で「中部」の位置をタップしよう。",
      correctId: "chubu",
      pinIds: ["kanto", "chubu", "kinki", "tohoku"],
      mapId: "japan_regions",
      explanation:
        "中部地方は本州のほぼ中央にあり、新潟・愛知・静岡などの県があります。",
      hint: "富士山があるあたりを含む地方だよ。",
      difficulty: 2,
    }),
    mapPinQuestion(4, {
      text: "日本地図で「近畿」の位置をタップしよう。",
      correctId: "kinki",
      pinIds: ["chubu", "kinki", "shikoku", "kanto"],
      mapId: "japan_prefectures",
      explanation:
        "近畿地方は本州の南西部にあり、大阪・京都・奈良などがあります。",
      hint: "大阪や京都がある地方だよ。",
      difficulty: 2,
    }),
    mapPinQuestion(5, {
      text: "日本地図で「四国」の位置をタップしよう。",
      correctId: "shikoku",
      pinIds: ["kinki", "chubu", "shikoku", "kyushu"],
      mapId: "japan_prefectures",
      explanation:
        "四国は本州の南に位置する島で、香川・愛媛・徳島・高知の4県があります。",
      hint: "本州と九州のあいだにある島だよ。",
      difficulty: 2,
    }),
    mapPinQuestion(6, {
      text: "日本地図で「九州」の位置をタップしよう。",
      correctId: "kyushu",
      pinIds: ["shikoku", "kinki", "chubu", "kyushu"],
      mapId: "japan_prefectures",
      explanation:
        "九州は本州の南西に位置し、福岡・熊本・鹿児島などの県があります。",
      hint: "日本の南西にある大きな島だよ。",
      difficulty: 2,
    }),
    mapPinQuestion(7, {
      text: "日本地図で「沖縄」の位置をタップしよう。",
      correctId: "okinawa",
      pinIds: ["kyushu", "kanto", "hokkaido", "okinawa"],
      mapId: "japan_prefectures",
      explanation:
        "沖縄は九州のさらに南の島にあり、日本の最南端の県です。地図の右下に示されています。",
      hint: "地図の右下の小さな枠の中を見てみよう。",
      difficulty: 2,
    }),
    mapPinQuestion(8, {
      text: "日本列島で「本州」の位置をタップしよう。",
      correctId: "honshu",
      pinIds: ["hokkaido", "honshu", "shikoku", "kyushu"],
      mapId: "japan_islands",
      explanation:
        "本州は日本でいちばん大きな島で、東北・関東・近畿など多くの地方を含みます。",
      hint: "いちばん大きくて細長い島だよ。",
      learningPoint: "国土の構成",
    }),
    mapPinQuestion(9, {
      text: "日本列島で「最北の大きな島」の位置をタップしよう。",
      correctId: "hokkaido",
      pinIds: ["hokkaido", "honshu", "shikoku", "kyushu"],
      mapId: "japan_islands",
      explanation:
        "日本の国土は北海道・本州・四国・九州・沖縄などの島々からなっています。",
      hint: "日本でいちばん北にある島だよ。",
      learningPoint: "国土の構成",
    }),
    mapPinQuestion(10, {
      text: "日本列島で「四国」の位置をタップしよう。",
      correctId: "shikoku",
      pinIds: ["honshu", "shikoku", "kyushu", "hokkaido"],
      mapId: "japan_islands",
      explanation:
        "四国は本州と九州のあいだにある、4つの県からなる島です。",
      hint: "本州の南、九州の北東にある島だよ。",
      learningPoint: "国土の構成",
      difficulty: 2,
    }),
    mapPinQuestion(11, {
      text: "日本列島で「九州」の位置をタップしよう。",
      correctId: "kyushu",
      pinIds: ["honshu", "shikoku", "kyushu", "hokkaido"],
      mapId: "japan_islands",
      explanation:
        "九州は本州の南西に位置する大きな島で、7つの県があります。",
      hint: "本州の西のはじっこ、南の方にある島だよ。",
      learningPoint: "国土の構成",
      difficulty: 2,
    }),
  ];

  const knowledgeQuestion: Question = {
    id: "pref_loc_q013",
    unit_id: "prefectures-location",
    type: "multiple_choice",
    difficulty: 1,
    question: {
      text: "日本は全部でいくつの都道府県でできていますか？",
      choices: [
        { id: "a", text: "47都道府県" },
        { id: "b", text: "50都道府県" },
        { id: "c", text: "43都道府県" },
        { id: "d", text: "31都道府県" },
      ],
    },
    answer: { correct_ids: ["a"] },
    explanation: {
      short:
        "日本は1都（東京）、1道（北海道）、2府（大阪・京都）、43県の計47都道府県で構成されています。",
    },
    curriculum_ref: {
      grade: 4,
      unit_number: 1,
      learning_point: "47都道府県",
    },
    hint: "四十七都道府県の「47」を思い出そう。",
    tags: ["都道府県"],
  };

  return [...mapQuestions, knowledgeQuestion];
}
