export interface PrefectureShape {
  id: string;
  name: string;
  imagePath: string;
}

/** 都道府県形イラスト（todouhukenkatati 由来・文字除去済み） */
export const PREFECTURE_SHAPES: PrefectureShape[] = [
  { id: "hokkaidou", name: "北海道", imagePath: "/maps/prefecture-shapes/hokkaidou.png" },
  { id: "aomoriken", name: "青森県", imagePath: "/maps/prefecture-shapes/aomoriken.png" },
  { id: "iwateken", name: "岩手県", imagePath: "/maps/prefecture-shapes/iwateken.png" },
  { id: "miyagiken", name: "宮城県", imagePath: "/maps/prefecture-shapes/miyagiken.png" },
  { id: "akitaken", name: "秋田県", imagePath: "/maps/prefecture-shapes/akitaken.png" },
  { id: "yamagataken", name: "山形県", imagePath: "/maps/prefecture-shapes/yamagataken.png" },
  { id: "fukushimaken", name: "福島県", imagePath: "/maps/prefecture-shapes/fukushimaken.png" },
  { id: "ibarakiken", name: "茨城県", imagePath: "/maps/prefecture-shapes/ibarakiken.png" },
  { id: "tochigiken", name: "栃木県", imagePath: "/maps/prefecture-shapes/tochigiken.png" },
  { id: "gunmaken", name: "群馬県", imagePath: "/maps/prefecture-shapes/gunmaken.png" },
  { id: "saitamaken", name: "埼玉県", imagePath: "/maps/prefecture-shapes/saitamaken.png" },
  { id: "chibaken", name: "千葉県", imagePath: "/maps/prefecture-shapes/chibaken.png" },
  { id: "toukyouto", name: "東京都", imagePath: "/maps/prefecture-shapes/toukyouto.png" },
  { id: "kanagawaken", name: "神奈川県", imagePath: "/maps/prefecture-shapes/kanagawaken.png" },
  { id: "niigataken", name: "新潟県", imagePath: "/maps/prefecture-shapes/niigataken.png" },
  { id: "toyamaken", name: "富山県", imagePath: "/maps/prefecture-shapes/toyamaken.png" },
  { id: "ishikawaken", name: "石川県", imagePath: "/maps/prefecture-shapes/ishikawaken.png" },
  { id: "fukuiken", name: "福井県", imagePath: "/maps/prefecture-shapes/fukuiken.png" },
  { id: "yamanashiken", name: "山梨県", imagePath: "/maps/prefecture-shapes/yamanashiken.png" },
  { id: "naganoken", name: "長野県", imagePath: "/maps/prefecture-shapes/naganoken.png" },
  { id: "gifuken", name: "岐阜県", imagePath: "/maps/prefecture-shapes/gifuken.png" },
  { id: "shizuokaken", name: "静岡県", imagePath: "/maps/prefecture-shapes/shizuokaken.png" },
  { id: "aichiken", name: "愛知県", imagePath: "/maps/prefecture-shapes/aichiken.png" },
  { id: "mieken", name: "三重県", imagePath: "/maps/prefecture-shapes/mieken.png" },
  { id: "shigaken", name: "滋賀県", imagePath: "/maps/prefecture-shapes/shigaken.png" },
  { id: "kyoutofu", name: "京都府", imagePath: "/maps/prefecture-shapes/kyoutofu.png" },
  { id: "oosakafu", name: "大阪府", imagePath: "/maps/prefecture-shapes/oosakafu.png" },
  { id: "hyougoken", name: "兵庫県", imagePath: "/maps/prefecture-shapes/hyougoken.png" },
  { id: "naraken", name: "奈良県", imagePath: "/maps/prefecture-shapes/naraken.png" },
  { id: "wakayamaken", name: "和歌山県", imagePath: "/maps/prefecture-shapes/wakayamaken.png" },
  { id: "tottoriken", name: "鳥取県", imagePath: "/maps/prefecture-shapes/tottoriken.png" },
  { id: "shimaneken", name: "島根県", imagePath: "/maps/prefecture-shapes/shimaneken.png" },
  { id: "okayamaken", name: "岡山県", imagePath: "/maps/prefecture-shapes/okayamaken.png" },
  { id: "hiroshimaken", name: "広島県", imagePath: "/maps/prefecture-shapes/hiroshimaken.png" },
  { id: "yamaguchiken", name: "山口県", imagePath: "/maps/prefecture-shapes/yamaguchiken.png" },
  { id: "tokushimaken", name: "徳島県", imagePath: "/maps/prefecture-shapes/tokushimaken.png" },
  { id: "kagawaken", name: "香川県", imagePath: "/maps/prefecture-shapes/kagawaken.png" },
  { id: "ehimeken", name: "愛媛県", imagePath: "/maps/prefecture-shapes/ehimeken.png" },
  { id: "kouchiken", name: "高知県", imagePath: "/maps/prefecture-shapes/kouchiken.png" },
  { id: "fukuokaken", name: "福岡県", imagePath: "/maps/prefecture-shapes/fukuokaken.png" },
  { id: "sagaken", name: "佐賀県", imagePath: "/maps/prefecture-shapes/sagaken.png" },
  { id: "nagasakiken", name: "長崎県", imagePath: "/maps/prefecture-shapes/nagasakiken.png" },
  { id: "kumamotoken", name: "熊本県", imagePath: "/maps/prefecture-shapes/kumamotoken.png" },
  { id: "ooitaken", name: "大分県", imagePath: "/maps/prefecture-shapes/ooitaken.png" },
  { id: "miyazakiken", name: "宮崎県", imagePath: "/maps/prefecture-shapes/miyazakiken.png" },
  { id: "kagoshimaken", name: "鹿児島県", imagePath: "/maps/prefecture-shapes/kagoshimaken.png" },
  { id: "okinawaken", name: "沖縄県", imagePath: "/maps/prefecture-shapes/okinawaken.png" },
];

const shapeById = new Map(PREFECTURE_SHAPES.map((s) => [s.id, s]));

export function getPrefectureShapeById(id: string): PrefectureShape | undefined {
  return shapeById.get(id);
}
