import { PREFECTURE_SHAPES } from "@/data/prefectureShapes";

export interface PrefectureCapitalRow {
  prefecture: string;
  capital: string;
  region: string;
  shapeId: string;
}

/** 47都道府県の県庁所在地・地方区分（正答データ） */
const PREFECTURE_CAPITAL_RAW: [string, string, string][] = [
  ["北海道", "札幌市", "北海道"],
  ["青森県", "青森市", "東北"],
  ["岩手県", "盛岡市", "東北"],
  ["宮城県", "仙台市", "東北"],
  ["秋田県", "秋田市", "東北"],
  ["山形県", "山形市", "東北"],
  ["福島県", "福島市", "東北"],
  ["茨城県", "水戸市", "関東"],
  ["栃木県", "宇都宮市", "関東"],
  ["群馬県", "前橋市", "関東"],
  ["埼玉県", "さいたま市", "関東"],
  ["千葉県", "千葉市", "関東"],
  ["東京都", "新宿区（都庁）", "関東"],
  ["神奈川県", "横浜市", "関東"],
  ["新潟県", "新潟市", "中部"],
  ["富山県", "富山市", "中部"],
  ["石川県", "金沢市", "中部"],
  ["福井県", "福井市", "中部"],
  ["山梨県", "甲府市", "中部"],
  ["長野県", "長野市", "中部"],
  ["岐阜県", "岐阜市", "中部"],
  ["静岡県", "静岡市", "中部"],
  ["愛知県", "名古屋市", "中部"],
  ["三重県", "津市", "近畿"],
  ["滋賀県", "大津市", "近畿"],
  ["京都府", "京都市", "近畿"],
  ["大阪府", "大阪市", "近畿"],
  ["兵庫県", "神戸市", "近畿"],
  ["奈良県", "奈良市", "近畿"],
  ["和歌山県", "和歌山市", "近畿"],
  ["鳥取県", "鳥取市", "中国"],
  ["島根県", "松江市", "中国"],
  ["岡山県", "岡山市", "中国"],
  ["広島県", "広島市", "中国"],
  ["山口県", "山口市", "中国"],
  ["徳島県", "徳島市", "四国"],
  ["香川県", "高松市", "四国"],
  ["愛媛県", "松山市", "四国"],
  ["高知県", "高知市", "四国"],
  ["福岡県", "福岡市", "九州・沖縄"],
  ["佐賀県", "佐賀市", "九州・沖縄"],
  ["長崎県", "長崎市", "九州・沖縄"],
  ["熊本県", "熊本市", "九州・沖縄"],
  ["大分県", "大分市", "九州・沖縄"],
  ["宮崎県", "宮崎市", "九州・沖縄"],
  ["鹿児島県", "鹿児島市", "九州・沖縄"],
  ["沖縄県", "那覇市", "九州・沖縄"],
];

export const PREFECTURE_CAPITAL_ROWS: PrefectureCapitalRow[] =
  PREFECTURE_CAPITAL_RAW.map(([prefecture, capital, region], index) => ({
    prefecture,
    capital,
    region,
    shapeId: PREFECTURE_SHAPES[index]?.id ?? "",
  }));

const rowByShapeId = new Map(
  PREFECTURE_CAPITAL_ROWS.map((row) => [row.shapeId, row]),
);

export function getPrefectureCapitalRow(
  shapeId: string,
): PrefectureCapitalRow | undefined {
  return rowByShapeId.get(shapeId);
}
