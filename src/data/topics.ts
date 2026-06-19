export type TopicId =
  | "prefectures"
  | "world"
  | "map_symbols"
  | "industry"
  | "history"
  | "civics";

export interface Topic {
  id: TopicId;
  title: string;
  emoji: string;
  description: string;
  color: string;
}

/** 学年を問わず学べる6つのテーマ（MVP） */
export const TOPICS: Topic[] = [
  {
    id: "prefectures",
    title: "都道府県",
    emoji: "🗾",
    description: "47都道府県の位置・形・県庁所在地",
    color: "from-sky-400 to-blue-500",
  },
  {
    id: "world",
    title: "世界の国",
    emoji: "🌍",
    description: "大陸・海洋・国の位置と日本との関係",
    color: "from-emerald-400 to-teal-500",
  },
  {
    id: "map_symbols",
    title: "地図記号",
    emoji: "🧭",
    description: "地図の読み方と記号の意味",
    color: "from-amber-400 to-orange-500",
  },
  {
    id: "industry",
    title: "産業",
    emoji: "🏭",
    description: "農業・水産業・工業とくらしのつながり",
    color: "from-violet-400 to-purple-500",
  },
  {
    id: "history",
    title: "歴史",
    emoji: "⏳",
    description: "時代の流れと日本の歴史上の出来事",
    color: "from-rose-400 to-red-500",
  },
  {
    id: "civics",
    title: "公民",
    emoji: "🏛️",
    description: "憲法・政治や選挙の仕組み",
    color: "from-indigo-400 to-blue-600",
  },
];

export function getTopicById(id: string): Topic | undefined {
  return TOPICS.find((t) => t.id === id);
}

/** 旧学年別 unit_id → 新テーマ id */
export const LEGACY_UNIT_TO_TOPIC: Record<string, TopicId> = {
  g3_u1: "map_symbols",
  g3_u2: "industry",
  g3_u3: "civics",
  g3_u4: "history",
  g4_u1: "prefectures",
  g4_u2: "civics",
  g4_u3: "civics",
  g4_u4: "history",
  g4_u5: "industry",
  g5_u1: "prefectures",
  g5_u2: "industry",
  g5_u3: "industry",
  g5_u4: "industry",
  g5_u5: "industry",
  g6_u1: "civics",
  g6_u2: "history",
  g6_u3: "world",
};

export function resolveTopicId(unitOrTopicId: string): string | null {
  if (TOPICS.some((t) => t.id === unitOrTopicId)) {
    return unitOrTopicId;
  }
  if (
    unitOrTopicId === "prefectures-location" ||
    unitOrTopicId === "prefectures-shape" ||
    unitOrTopicId === "prefectures-capital" ||
    /^prefectures-shape-[1-6]$/.test(unitOrTopicId) ||
    /^prefectures-capital-[1-6]$/.test(unitOrTopicId)
  ) {
    return unitOrTopicId;
  }
  if (
    unitOrTopicId === "industry-agriculture" ||
    unitOrTopicId === "industry-fisheries" ||
    unitOrTopicId === "industry-manufacturing"
  ) {
    return unitOrTopicId;
  }
  if (
    unitOrTopicId === "civics-constitution" ||
    unitOrTopicId === "civics-politics-election"
  ) {
    return unitOrTopicId;
  }
  if (unitOrTopicId === "history-jomon-yayoi") {
    return "history-jomon-yayoi";
  }
  if (unitOrTopicId === "history-kofun-asuka") {
    return "history-kofun-asuka";
  }
  if (unitOrTopicId === "history-nara-heian") {
    return "history-nara-heian";
  }
  if (unitOrTopicId === "history-muromachi-sengoku") {
    return "history-muromachi-sengoku";
  }
  if (unitOrTopicId === "history-meiji-taisho") {
    return "history-meiji-taisho";
  }
  if (
    unitOrTopicId === "history-timeline" ||
    unitOrTopicId === "history-jomon" ||
    unitOrTopicId === "history-yayoi" ||
    unitOrTopicId === "history-kofun" ||
    unitOrTopicId === "history-asuka" ||
    unitOrTopicId === "history-nara" ||
    unitOrTopicId === "history-heian" ||
    unitOrTopicId === "history-kamakura" ||
    unitOrTopicId === "history-muromachi" ||
    unitOrTopicId === "history-sengoku" ||
    unitOrTopicId === "history-azuchi-momoyama" ||
    unitOrTopicId === "history-edo" ||
    unitOrTopicId === "history-meiji" ||
    unitOrTopicId === "history-taisho" ||
    unitOrTopicId === "history-showa-prewar" ||
    unitOrTopicId === "history-showa-postwar"
  ) {
    return unitOrTopicId;
  }
  return LEGACY_UNIT_TO_TOPIC[unitOrTopicId] ?? null;
}

/** クイズ画面・結果画面用の表示ラベル */
export function getUnitLabel(unitId: string): {
  emoji: string;
  title: string;
  subtitle?: string;
} {
  if (
    unitId === "prefectures-location" ||
    unitId === "prefectures-shape" ||
    unitId === "prefectures-capital" ||
    /^prefectures-shape-[1-6]$/.test(unitId) ||
    /^prefectures-capital-[1-6]$/.test(unitId)
  ) {
    const subtitles: Record<string, string> = {
      "prefectures-location": "位置",
      "prefectures-shape": "形",
      "prefectures-capital": "県庁所在地",
      "prefectures-shape-1": "形 › 北海道・東北",
      "prefectures-shape-2": "形 › 関東",
      "prefectures-shape-3": "形 › 中部",
      "prefectures-shape-4": "形 › 近畿",
      "prefectures-shape-5": "形 › 中国・四国",
      "prefectures-shape-6": "形 › 九州・沖縄",
      "prefectures-capital-1": "県庁所在地 › 北海道・東北",
      "prefectures-capital-2": "県庁所在地 › 関東",
      "prefectures-capital-3": "県庁所在地 › 中部",
      "prefectures-capital-4": "県庁所在地 › 近畿",
      "prefectures-capital-5": "県庁所在地 › 中国・四国",
      "prefectures-capital-6": "県庁所在地 › 九州・沖縄",
    };
    return {
      emoji: "🗾",
      title: "都道府県",
      subtitle: subtitles[unitId],
    };
  }

  if (
    unitId === "industry-agriculture" ||
    unitId === "industry-fisheries" ||
    unitId === "industry-manufacturing"
  ) {
    const subtitles: Record<string, string> = {
      "industry-agriculture": "農業",
      "industry-fisheries": "水産業",
      "industry-manufacturing": "工業",
    };
    return {
      emoji: "🏭",
      title: "産業",
      subtitle: subtitles[unitId],
    };
  }

  if (
    unitId === "civics-constitution" ||
    unitId === "civics-politics-election"
  ) {
    const subtitles: Record<string, string> = {
      "civics-constitution": "憲法",
      "civics-politics-election": "政治や選挙",
    };
    return {
      emoji: "🏛️",
      title: "公民",
      subtitle: subtitles[unitId],
    };
  }

  if (
    unitId === "history-timeline" ||
    unitId === "history-jomon" ||
    unitId === "history-yayoi" ||
    unitId === "history-jomon-yayoi" ||
    unitId === "history-kofun" ||
    unitId === "history-asuka" ||
    unitId === "history-kofun-asuka" ||
    unitId === "history-nara" ||
    unitId === "history-heian" ||
    unitId === "history-nara-heian" ||
    unitId === "history-kamakura" ||
    unitId === "history-muromachi" ||
    unitId === "history-sengoku" ||
    unitId === "history-muromachi-sengoku" ||
    unitId === "history-azuchi-momoyama" ||
    unitId === "history-edo" ||
    unitId === "history-meiji" ||
    unitId === "history-taisho" ||
    unitId === "history-meiji-taisho" ||
    unitId === "history-showa-prewar" ||
    unitId === "history-showa-postwar"
  ) {
    const subtitles: Record<string, string> = {
      "history-timeline": "年表・並べ替え",
      "history-jomon": "縄文・弥生時代 › 縄文時代",
      "history-yayoi": "縄文・弥生時代 › 弥生時代",
      "history-jomon-yayoi": "縄文・弥生時代",
      "history-kofun": "古墳・飛鳥時代 › 古墳時代",
      "history-asuka": "古墳・飛鳥時代 › 飛鳥時代",
      "history-kofun-asuka": "古墳・飛鳥時代",
      "history-nara": "奈良・平安時代 › 奈良時代",
      "history-heian": "奈良・平安時代 › 平安時代",
      "history-nara-heian": "奈良・平安時代",
      "history-kamakura": "鎌倉時代",
      "history-muromachi": "室町・戦国時代 › 室町時代",
      "history-sengoku": "室町・戦国時代 › 戦国時代",
      "history-muromachi-sengoku": "室町・戦国時代",
      "history-azuchi-momoyama": "安土桃山時代",
      "history-edo": "江戸時代",
      "history-meiji": "明治・大正時代 › 明治時代",
      "history-taisho": "明治・大正時代 › 大正時代",
      "history-meiji-taisho": "明治・大正時代",
      "history-showa-prewar": "昭和時代（戦前）",
      "history-showa-postwar": "昭和時代（戦後）",
    };
    return {
      emoji: "⏳",
      title: "歴史",
      subtitle: subtitles[unitId],
    };
  }

  const topic = getTopicById(unitId);
  if (topic) {
    return { emoji: topic.emoji, title: topic.title };
  }

  return { emoji: "📚", title: unitId };
}
