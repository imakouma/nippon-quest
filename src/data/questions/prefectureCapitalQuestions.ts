import type { Question } from "@/types/question";
import type { PrefectureCapitalGroupId } from "@/data/prefectureModes";
import { PREFECTURE_CAPITAL_GROUPS } from "@/data/prefectureModes";
import {
  getPrefectureCapitalRow,
  type PrefectureCapitalRow,
} from "@/data/prefectureCapitalData";

interface PrefectureCapitalExtras {
  distractors: [string, string, string];
  hint: string;
  /** 県庁所在地が県内最大都市と異なりやすい */
  tricky?: boolean;
}

/** 誤答選択肢・ヒント（正答は PREFECTURE_CAPITAL_ROWS を参照） */
const PREFECTURE_CAPITAL_EXTRAS: Record<string, PrefectureCapitalExtras> = {
  hokkaidou: {
    distractors: ["函館市", "旭川市", "釧路市"],
    hint: "北海道で一番大きな都市だよ。",
  },
  aomoriken: {
    distractors: ["弘前市", "八戸市", "十和田市"],
    hint: "りんごで有名な県の中心部にある市だよ。",
  },
  iwateken: {
    distractors: ["北上市", "花巻市", "一関市"],
    hint: "わんこそばで有名な県の中心だよ。",
  },
  miyagiken: {
    distractors: ["石巻市", "大崎市", "気仙沼市"],
    hint: "東北で一番大きな都市だよ。",
  },
  akitaken: {
    distractors: ["横手市", "大館市", "能代市"],
    hint: "なまはげで有名な県の中心部だよ。",
  },
  yamagataken: {
    distractors: ["鶴岡市", "酒田市", "米沢市"],
    hint: "さくらんぼで有名な県の中心部だよ。",
  },
  fukushimaken: {
    distractors: ["郡山市", "いわき市", "会津若松市"],
    hint: "県の名前と同じ市だよ。",
    tricky: true,
  },
  ibarakiken: {
    distractors: ["つくば市", "日立市", "ひたちなか市"],
    hint: "梅の花で有名な城下町だよ。",
    tricky: true,
  },
  tochigiken: {
    distractors: ["小山市", "栃木市", "足利市"],
    hint: "餃子で有名な県の中心部だよ。",
  },
  gunmaken: {
    distractors: ["高崎市", "桐生市", "伊勢崎市"],
    hint: "赤城山のふもとにある市だよ。",
    tricky: true,
  },
  saitamaken: {
    distractors: ["川越市", "所沢市", "熊谷市"],
    hint: "浦和市と大宮市などが合併してできた市だよ。",
  },
  chibaken: {
    distractors: ["船橋市", "柏市", "市川市"],
    hint: "県の名前と同じ市だよ。",
  },
  toukyouto: {
    distractors: ["渋谷区", "港区", "千代田区"],
    hint: "都庁のある区だよ。",
    tricky: true,
  },
  kanagawaken: {
    distractors: ["川崎市", "相模原市", "藤沢市"],
    hint: "みなとみらいがある大きな港町だよ。",
  },
  niigataken: {
    distractors: ["長岡市", "上越市", "三条市"],
    hint: "日本海に面した大きな港町だよ。",
  },
  toyamaken: {
    distractors: ["高岡市", "魚津市", "砺波市"],
    hint: "県の名前と同じ市だよ。",
  },
  ishikawaken: {
    distractors: ["小松市", "加賀市", "七尾市"],
    hint: "兼六園で有名な城下町だよ。",
  },
  fukuiken: {
    distractors: ["敦賀市", "越前市", "坂井市"],
    hint: "恐竜の化石で有名な県の中心部だよ。",
    tricky: true,
  },
  yamanashiken: {
    distractors: ["富士吉田市", "都留市", "山梨市"],
    hint: "ぶどうとワインで有名な盆地の市だよ。",
    tricky: true,
  },
  naganoken: {
    distractors: ["松本市", "上田市", "飯田市"],
    hint: "オリンピックが開かれた県の中心部だよ。",
  },
  gifuken: {
    distractors: ["大垣市", "多治見市", "各務原市"],
    hint: "県の名前と同じ市だよ。",
  },
  shizuokaken: {
    distractors: ["浜松市", "沼津市", "富士市"],
    hint: "お茶で有名な県の中心部だよ。",
    tricky: true,
  },
  aichiken: {
    distractors: ["豊田市", "岡崎市", "一宮市"],
    hint: "とんかつや味噌カツで有名な大都市だよ。",
  },
  mieken: {
    distractors: ["四日市市", "松阪市", "伊勢市"],
    hint: "「つ」と書く市だよ。",
    tricky: true,
  },
  shigaken: {
    distractors: ["草津市", "彦根市", "長浜市"],
    hint: "琵琶湖のほとりにある市だよ。",
    tricky: true,
  },
  kyoutofu: {
    distractors: ["宇治市", "舞鶴市", "福知山市"],
    hint: "お寺や神社がたくさんある古都だよ。",
  },
  oosakafu: {
    distractors: ["堺市", "東大阪市", "豊中市"],
    hint: "関西で一番大きな都市だよ。",
  },
  hyougoken: {
    distractors: ["姫路市", "西宮市", "尼崎市"],
    hint: "ポートタワーがある港町だよ。",
  },
  naraken: {
    distractors: ["橿原市", "生駒市", "大和郡山市"],
    hint: "鹿で有名な古都だよ。",
  },
  wakayamaken: {
    distractors: ["田辺市", "橋本市", "新宮市"],
    hint: "県の名前と同じ市だよ。",
  },
  tottoriken: {
    distractors: ["米子市", "倉吉市", "境港市"],
    hint: "砂丘で有名な県の中心部だよ。",
    tricky: true,
  },
  shimaneken: {
    distractors: ["出雲市", "浜田市", "益田市"],
    hint: "宍道湖のほとりにある城下町だよ。",
    tricky: true,
  },
  okayamaken: {
    distractors: ["倉敷市", "津山市", "総社市"],
    hint: "桃太郎のふるさととして知られる市だよ。",
  },
  hiroshimaken: {
    distractors: ["福山市", "呉市", "尾道市"],
    hint: "原爆ドームがある平和の記念公園の市だよ。",
  },
  yamaguchiken: {
    distractors: ["下関市", "宇部市", "周南市"],
    hint: "県の名前と同じ市だよ。",
    tricky: true,
  },
  tokushimaken: {
    distractors: ["阿南市", "鳴門市", "小松島市"],
    hint: "阿波おどりで有名な市だよ。",
  },
  kagawaken: {
    distractors: ["丸亀市", "坂出市", "観音寺市"],
    hint: "うどんで有名な香川県の中心部だよ。",
  },
  ehimeken: {
    distractors: ["今治市", "新居浜市", "宇和島市"],
    hint: "道後温泉で有名な市だよ。",
  },
  kouchiken: {
    distractors: ["室戸市", "南国市", "四万十市"],
    hint: "坂本龍馬で有名な県の中心部だよ。",
  },
  fukuokaken: {
    distractors: ["北九州市", "久留米市", "飯塚市"],
    hint: "九州で一番大きな都市だよ。",
  },
  sagaken: {
    distractors: ["唐津市", "鳥栖市", "伊万里市"],
    hint: "県の名前と同じ市だよ。",
    tricky: true,
  },
  nagasakiken: {
    distractors: ["佐世保市", "諫早市", "大村市"],
    hint: "出島で海外との交流があった港町だよ。",
  },
  kumamotoken: {
    distractors: ["八代市", "天草市", "玉名市"],
    hint: "くまモンがいる県の中心部だよ。",
  },
  ooitaken: {
    distractors: ["別府市", "中津市", "日田市"],
    hint: "県の名前と同じ市だよ。",
  },
  miyazakiken: {
    distractors: ["都城市", "延岡市", "日南市"],
    hint: "県の名前と同じ市だよ。",
  },
  kagoshimaken: {
    distractors: ["霧島市", "鹿屋市", "枕崎市"],
    hint: "桜島が見える県の中心部だよ。",
  },
  okinawaken: {
    distractors: ["沖縄市", "うるま市", "宜野湾市"],
    hint: "首里城があった沖縄の中心の市だよ。",
  },
};

function govOfficeLabel(prefectureName: string): string {
  if (prefectureName.endsWith("都")) return "都庁所在地";
  if (prefectureName.endsWith("道")) return "道庁所在地";
  if (prefectureName.endsWith("府")) return "府庁所在地";
  return "県庁所在地";
}

function buildForwardCapitalQuestion(
  row: PrefectureCapitalRow,
  unitId: PrefectureCapitalGroupId,
  index: number,
): Question {
  const extras = PREFECTURE_CAPITAL_EXTRAS[row.shapeId];
  if (!extras) {
    throw new Error(`Missing capital extras for ${row.shapeId}`);
  }

  const officeLabel = govOfficeLabel(row.prefecture);
  const choices = [
    { id: "a", text: row.capital },
    { id: "b", text: extras.distractors[0] },
    { id: "c", text: extras.distractors[1] },
    { id: "d", text: extras.distractors[2] },
  ];

  const groupNumber = unitId.replace("prefectures-capital-", "");

  return {
    id: `pref_cap_${groupNumber}_q${String(index + 1).padStart(3, "0")}`,
    unit_id: unitId,
    type: "multiple_choice",
    difficulty: extras.tricky ? 2 : 1,
    question: {
      text: `${row.prefecture}の${officeLabel}はどこですか？`,
      choices,
    },
    answer: { correct_ids: ["a"] },
    explanation: {
      short: `${row.prefecture}の${officeLabel}は${row.capital}です。`,
    },
    curriculum_ref: {
      grade: 4,
      unit_number: 1,
      learning_point: "県庁所在地",
    },
    hint: extras.hint,
    tags: ["都道府県", row.shapeId, "県庁所在地"],
  };
}

export function buildPrefectureCapitalQuestionsForGroup(
  groupId: PrefectureCapitalGroupId,
): Question[] {
  const group = PREFECTURE_CAPITAL_GROUPS.find((g) => g.id === groupId);
  if (!group) return [];

  return group.shapeIds.map((shapeId, index) => {
    const row = getPrefectureCapitalRow(shapeId);
    if (!row) {
      throw new Error(`Missing capital row for ${shapeId}`);
    }
    return buildForwardCapitalQuestion(row, groupId, index);
  });
}

export function buildAllPrefectureCapitalQuestionsByGroup(): Record<
  PrefectureCapitalGroupId,
  Question[]
> {
  return Object.fromEntries(
    PREFECTURE_CAPITAL_GROUPS.map((group) => [
      group.id,
      buildPrefectureCapitalQuestionsForGroup(group.id),
    ]),
  ) as Record<PrefectureCapitalGroupId, Question[]>;
}

/** 都道府県「県庁所在地」モードの全問題（47都道府県） */
export function buildAllPrefectureCapitalQuestions(): Question[] {
  return PREFECTURE_CAPITAL_GROUPS.flatMap((group) =>
    buildPrefectureCapitalQuestionsForGroup(group.id),
  );
}
