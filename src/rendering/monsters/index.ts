/**
 * 手描きのモンスター（県のモチーフが一目で分かる仮素材）。本番の PNG が同じキーで読み込まれていれば、そちらが優先。
 * キー：<monsterId>（バトル）/ <monsterId>.p<番号>（ボスのフェーズ差分）/ <monsterId>.field（フィールドに立つ中ボス 32×32）
 * ここに無いモンスターは battle/pixelArt.ts の monsterArt（属性の形で自動生成）になる。
 */
import { toCanvas } from '../grid';
import { AICHI } from './aichi';
import { AKITA } from './akita';
import { AOMORI } from './aomori';
import { CHIBA } from './chiba';
import { CHUGOKU } from './chugoku';
import { designGrid, type MonsterDesign } from './design';
import { EHIME } from './ehime';
import { FUKUI } from './fukui';
import { FUKUOKA } from './fukuoka';
import { FUKUSHIMA } from './fukushima';
import { GIFU } from './gifu';
import { GUNMA } from './gunma';
import { HIROSHIMA } from './hiroshima';
import { HOKKAIDO } from './hokkaido';
import { HOKURIKU } from './hokuriku';
import { HYOGO } from './hyogo';
import { IBARAKI } from './ibaraki';
import { ISHIKAWA } from './ishikawa';
import { IWATE } from './iwate';
import { KAGAWA } from './kagawa';
import { KAGOSHIMA } from './kagoshima';
import { KANAGAWA } from './kanagawa';
import { KINKI } from './kinki';
import { KOCHI } from './kochi';
import { KOSHINETSU } from './koshinetsu';
import { KUMAMOTO } from './kumamoto';
import { KYOTO } from './kyoto';
import { KYUSHU_OKINAWA } from './kyushuOkinawa';
import { LAST_BOSSES } from './lastbosses';
import { MIE } from './mie';
import { MIYAGI } from './miyagi';
import { MIYAZAKI } from './miyazaki';
import { NAGANO } from './nagano';
import { NAGASAKI } from './nagasaki';
import { NARA } from './nara';
import { NIIGATA } from './niigata';
import { OITA } from './oita';
import { OKAYAMA } from './okayama';
import { OKINAWA } from './okinawa';
import { OSAKA } from './osaka';
import { SAGA } from './saga';
import { SAITAMA } from './saitama';
import { SHIGA } from './shiga';
import { SHIMANE } from './shimane';
import { SHIKOKU } from './shikoku';
import { SHIZUOKA } from './shizuoka';
import { TOCHIGI } from './tochigi';
import { TOHOKU } from './tohoku';
import { TOKUSHIMA } from './tokushima';
import { TOKYO } from './tokyo';
import { TOKAI } from './tokai';
import { TOTTORI } from './tottori';
import { TOYAMA } from './toyama';
import { WAKAYAMA } from './wakayama';
import { YAMAGATA } from './yamagata';
import { YAMAGUCHI } from './yamaguchi';
import { YAMANASHI } from './yamanashi';

export const MONSTER_DESIGNS: Readonly<Record<string, MonsterDesign>> = {
  // 東北
  ...AOMORI,
  ...IWATE,
  ...MIYAGI,
  ...AKITA,
  ...YAMAGATA,
  ...FUKUSHIMA,
  ...TOHOKU,
  // 北海道
  ...HOKKAIDO,
  // 関東
  ...IBARAKI,
  ...TOCHIGI,
  ...GUNMA,
  ...SAITAMA,
  ...CHIBA,
  ...TOKYO,
  ...KANAGAWA,
  // 北陸
  ...HOKURIKU,
  ...NIIGATA,
  ...TOYAMA,
  ...ISHIKAWA,
  ...FUKUI,
  // 甲信
  ...KOSHINETSU,
  ...YAMANASHI,
  ...NAGANO,
  // 東海
  ...TOKAI,
  ...GIFU,
  ...SHIZUOKA,
  ...AICHI,
  ...MIE,
  // 近畿
  ...KINKI,
  ...SHIGA,
  ...KYOTO,
  ...OSAKA,
  ...HYOGO,
  ...NARA,
  ...WAKAYAMA,
  // 中国
  ...CHUGOKU,
  ...TOTTORI,
  ...SHIMANE,
  ...OKAYAMA,
  ...HIROSHIMA,
  ...YAMAGUCHI,
  // 四国
  ...SHIKOKU,
  ...TOKUSHIMA,
  ...KAGAWA,
  ...EHIME,
  ...KOCHI,
  // 九州
  ...KYUSHU_OKINAWA,
  ...FUKUOKA,
  ...SAGA,
  ...NAGASAKI,
  ...KUMAMOTO,
  ...OITA,
  ...MIYAZAKI,
  ...KAGOSHIMA,
  ...OKINAWA,
  // 裏ステージの ラスボス（東北の 歴史上の人物。ほかの県は その県の ファイルに ある）
  ...LAST_BOSSES,
};

/** 手描きの絵があれば Canvas にする。フェーズ差分（.p<番号>）が無いボスは、ふだんの絵のまま */
export function designedMonsterArt(id: string, suffix = ''): HTMLCanvasElement | null {
  const d = MONSTER_DESIGNS[`${id}${suffix}`] ?? (suffix.startsWith('.p') ? MONSTER_DESIGNS[id] : undefined);
  return d ? toCanvas(designGrid(d)) : null;
}
