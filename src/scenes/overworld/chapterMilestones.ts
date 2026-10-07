import type { GameState } from '../../core/state/schema';
import type { DialogueLine } from '../../ui/dialogue';
import { t, tOpt } from '../../ui/i18n';

const STORY_AREAS = new Set([
  'aomori',
  'iwate',
  'miyagi',
  'akita',
  'yamagata',
  'fukushima',
  'hokkaido',
  'ibaraki',
  'tochigi',
  'gunma',
  'saitama',
  'chiba',
  'tokyo',
  'kanagawa',
  'niigata',
  'toyama',
  'ishikawa',
  'fukui',
  'yamanashi',
  'nagano',
  'gifu',
  'shizuoka',
  'aichi',
  'mie',
  'shiga',
  'kyoto',
  'osaka',
  'hyogo',
  'nara',
  'wakayama',
  'tottori',
  'shimane',
  'okayama',
  'hiroshima',
  'yamaguchi',
  'tokushima',
  'kagawa',
  'ehime',
  'kochi',
  'fukuoka',
  'saga',
  'nagasaki',
  'kumamoto',
  'oita',
  'miyazaki',
  'kagoshima',
  'okinawa',
]);
const KANTO_AREAS = new Set(['ibaraki', 'tochigi', 'gunma', 'saitama', 'chiba', 'tokyo', 'kanagawa']);
const HOKURIKU_AREAS = new Set(['niigata', 'toyama', 'ishikawa', 'fukui']);
const KOSHINETSU_AREAS = new Set(['yamanashi', 'nagano']);
const TOKAI_AREAS = new Set(['gifu', 'shizuoka', 'aichi', 'mie']);
const KINKI_AREAS = new Set(['shiga', 'kyoto', 'osaka', 'hyogo', 'nara', 'wakayama']);
const CHUGOKU_AREAS = new Set(['tottori', 'shimane', 'okayama', 'hiroshima', 'yamaguchi']);
const SHIKOKU_AREAS = new Set(['tokushima', 'kagawa', 'ehime', 'kochi']);
const KYUSHU_OKINAWA_AREAS = new Set([
  'fukuoka',
  'saga',
  'nagasaki',
  'kumamoto',
  'oita',
  'miyazaki',
  'kagoshima',
  'okinawa',
]);

function chapterGroup(areaId: string): string {
  if (KANTO_AREAS.has(areaId)) return 'kanto';
  if (HOKURIKU_AREAS.has(areaId)) return 'hokuriku';
  if (KOSHINETSU_AREAS.has(areaId)) return 'koshinetsu';
  if (TOKAI_AREAS.has(areaId)) return 'tokai';
  if (KINKI_AREAS.has(areaId)) return 'kinki';
  if (CHUGOKU_AREAS.has(areaId)) return 'chugoku';
  if (SHIKOKU_AREAS.has(areaId)) return 'shikoku';
  if (KYUSHU_OKINAWA_AREAS.has(areaId)) return 'kyushuOkinawa';
  return areaId;
}

interface CompanionVoice {
  id: string;
  name: string;
}

function companionLine(phase: 'mid' | 'sign', areaId: string, companion?: CompanionVoice): DialogueLine[] {
  if (!companion) return [];
  const text =
    tOpt(`field.chapterMilestone.${phase}.${areaId}.companion.${companion.id}`) ??
    tOpt(`field.chapterMilestone.${phase}.${areaId}.companion.default`) ??
    tOpt(`field.chapterMilestone.${phase}.${chapterGroup(areaId)}.companion.default`);
  return text ? [{ speaker: companion.name, text }] : [];
}

function milestoneText(phase: 'mid' | 'sign', areaId: string, part: 'hero' | 'michiru' | 'journal'): string {
  return (
    tOpt(`field.chapterMilestone.${phase}.${areaId}.${part}`) ??
    t(`field.chapterMilestone.${phase}.${chapterGroup(areaId)}.${part}`)
  );
}

/** 県の中盤を越えたとき、攻略結果をその県の物語へ戻す。 */
export function midBossStoryLines(
  areaId: string,
  game: GameState,
  companion?: CompanionVoice,
): DialogueLine[] {
  if (!STORY_AREAS.has(areaId)) return [];
  return [
    { speaker: game.player.name, text: milestoneText('mid', areaId, 'hero') },
    ...companionLine('mid', areaId, companion),
    { speaker: t('field.prologueFairy'), text: milestoneText('mid', areaId, 'michiru') },
    { text: milestoneText('mid', areaId, 'journal') },
  ];
}

/** 県のしるしを得たとき、学んだ意味と次の土地への問いを残す。 */
export function areaBossStoryLines(
  areaId: string,
  game: GameState,
  companion?: CompanionVoice,
): DialogueLine[] {
  if (!STORY_AREAS.has(areaId)) return [];
  return [
    { speaker: game.player.name, text: milestoneText('sign', areaId, 'hero') },
    ...companionLine('sign', areaId, companion),
    { speaker: t('field.prologueFairy'), text: milestoneText('sign', areaId, 'michiru') },
    { text: milestoneText('sign', areaId, 'journal') },
  ];
}

/** 青森の地域のぬしが、本来の役目と次の土地への道を思い出す。 */
export function regionBossStoryLines(areaId: string, regionId: string, bossName: string): DialogueLine[] {
  if (areaId !== 'aomori') return [];
  const base = `field.regionMilestone.${areaId}.${regionId}`;
  const boss = tOpt(`${base}.boss`);
  const michiru = tOpt(`${base}.michiru`);
  const journal = tOpt(`${base}.journal`);
  if (!boss || !michiru || !journal) return [];
  return [
    { speaker: bossName, text: boss },
    { speaker: t('field.prologueFairy'), text: michiru },
    { text: journal },
  ];
}

/** 歴史の番人の試練を終え、土地から受け継ぐものを主人公の言葉で残す。 */
export function lastBossStoryLines(areaId: string, playerName: string): DialogueLine[] {
  if (!STORY_AREAS.has(areaId)) return [];
  const base = `field.historyLegacy.${chapterGroup(areaId)}`;
  return [
    { speaker: playerName, text: t(`${base}.hero`) },
    { speaker: t('field.prologueFairy'), text: t(`${base}.michiru`) },
    { text: t(`${base}.journal`) },
    { text: t(`${base}.memory`) },
  ];
}

interface IslandEpilogueOptions {
  bossName?: string;
  playerName: string;
  companion?: CompanionVoice;
}

const STORY_ISLAND_IDS = new Set([
  'tohoku',
  'hokkaido',
  'kanto',
  'hokuriku',
  'koshinetsu',
  'tokai',
  'kinki',
  'chugoku',
  'shikoku',
  'kyushu-okinawa',
]);

/** 地方ボス戦の導入。地方ごとの学びとボスの目的を、戦闘前に短く示す。 */
export function islandBossIntroLines(islandId: string, bossName: string, playerName: string): DialogueLine[] {
  if (!STORY_ISLAND_IDS.has(islandId)) return [];
  const storyId = islandId === 'kyushu-okinawa' ? 'kyushuOkinawa' : islandId;
  const base = `field.islandStory.${storyId}.intro`;
  return [
    { speaker: t('field.prologueFairy'), text: t(`${base}.ask`) },
    { speaker: t('field.prologueFairy'), text: t(`${base}.michiru`) },
    { speaker: bossName, text: t(`${base}.boss`) },
    { speaker: playerName, text: t(`${base}.hero`) },
  ];
}

/** 第一章の人物と伏線をまとめて回収する東北終幕。 */
export function tohokuIslandEpilogueLines(options: IslandEpilogueOptions): DialogueLine[] {
  const companionText = options.companion
    ? (tOpt(`field.islandCompanion.${options.companion.id}`) ?? tOpt('field.islandCompanion.default'))
    : undefined;
  return [
    { speaker: options.bossName, text: t('field.islandBossSecret') },
    { speaker: options.bossName, text: t('field.islandBossWarning') },
    { speaker: t('field.prologueFairy'), text: t('field.islandFairyDeflect') },
    { speaker: options.playerName, text: t('field.islandHeroDoubt') },
    { speaker: t('field.prologueFairy'), text: t('field.islandFairyMemory') },
    { text: t('field.islandBossCleared') },
    { text: t('field.islandPeopleReturn') },
    { speaker: t('field.storyHaru'), text: t('field.islandHaruFinal') },
    ...(options.companion && companionText ? [{ speaker: options.companion.name, text: companionText }] : []),
    { text: t('field.islandBagGrew') },
    { speaker: t('field.prologueFairy'), text: t('field.islandFairyNext') },
    { text: t('field.islandChapterEnd') },
  ];
}

/** 第二章の答えと、ミチルの過去へ続く新しい手がかりを残す北海道終幕。 */
function hokkaidoIslandEpilogueLines(options: IslandEpilogueOptions): DialogueLine[] {
  const base = 'field.islandStory.hokkaido.epilogue';
  const companionText = options.companion
    ? (tOpt(`${base}.companion.${options.companion.id}`) ?? tOpt(`${base}.companion.default`))
    : undefined;
  return [
    { speaker: options.bossName, text: t(`${base}.bossTruth`) },
    { speaker: options.bossName, text: t(`${base}.bossClue`) },
    { speaker: t('field.prologueFairy'), text: t(`${base}.michiru`) },
    { speaker: options.playerName, text: t(`${base}.hero`) },
    { text: t(`${base}.barrier`) },
    { speaker: t('field.storyHaru'), text: t(`${base}.haru`) },
    ...(options.companion && companionText ? [{ speaker: options.companion.name, text: companionText }] : []),
    { text: t(`${base}.bag`) },
    { speaker: t('field.prologueFairy'), text: t(`${base}.next`) },
    { text: t(`${base}.chapterEnd`) },
  ];
}

/** 第三章の七つの声を結び、主人公自身が噂を広めた記憶へ踏み込む関東終幕。 */
function kantoIslandEpilogueLines(options: IslandEpilogueOptions): DialogueLine[] {
  const base = 'field.islandStory.kanto.epilogue';
  const companionText = options.companion
    ? (tOpt(`${base}.companion.${options.companion.id}`) ?? tOpt(`${base}.companion.default`))
    : undefined;
  return [
    { speaker: options.bossName, text: t(`${base}.bossTruth`) },
    { speaker: options.bossName, text: t(`${base}.bossClue`) },
    { speaker: options.playerName, text: t(`${base}.heroMemory`) },
    { speaker: t('field.prologueFairy'), text: t(`${base}.michiru`) },
    { speaker: options.playerName, text: t(`${base}.heroResolve`) },
    { text: t(`${base}.network`) },
    { speaker: t('field.storyHaru'), text: t(`${base}.haru`) },
    ...(options.companion && companionText ? [{ speaker: options.companion.name, text: companionText }] : []),
    { text: t(`${base}.bag`) },
    { speaker: t('field.prologueFairy'), text: t(`${base}.next`) },
    { text: t(`${base}.chapterEnd`) },
  ];
}

/** 第四章で空白を空白のまま扱う勇気を得て、改ざんされた原記録へ近づく北陸終幕。 */
function hokurikuIslandEpilogueLines(options: IslandEpilogueOptions): DialogueLine[] {
  const base = 'field.islandStory.hokuriku.epilogue';
  const companionText = options.companion
    ? (tOpt(`${base}.companion.${options.companion.id}`) ?? tOpt(`${base}.companion.default`))
    : undefined;
  return [
    { speaker: options.bossName, text: t(`${base}.bossTruth`) },
    { speaker: options.bossName, text: t(`${base}.bossClue`) },
    { speaker: t('field.prologueFairy'), text: t(`${base}.michiru`) },
    { speaker: options.playerName, text: t(`${base}.hero`) },
    { text: t(`${base}.restored`) },
    { speaker: t('field.storyHaru'), text: t(`${base}.haru`) },
    ...(options.companion && companionText ? [{ speaker: options.companion.name, text: companionText }] : []),
    { text: t(`${base}.bag`) },
    { speaker: t('field.prologueFairy'), text: t(`${base}.next`) },
    { text: t(`${base}.chapterEnd`) },
  ];
}

/** 第五章の二つの視点を重ね、黒幕へ続く観測記録を回収する甲信終幕。 */
function koshinetsuIslandEpilogueLines(options: IslandEpilogueOptions): DialogueLine[] {
  const base = 'field.islandStory.koshinetsu.epilogue';
  const companionText = options.companion
    ? (tOpt(`${base}.companion.${options.companion.id}`) ?? tOpt(`${base}.companion.default`))
    : undefined;
  return [
    { speaker: options.bossName, text: t(`${base}.bossTruth`) },
    { speaker: options.bossName, text: t(`${base}.bossClue`) },
    { speaker: t('field.prologueFairy'), text: t(`${base}.michiru`) },
    { speaker: options.playerName, text: t(`${base}.hero`) },
    { text: t(`${base}.restored`) },
    { speaker: t('field.storyHaru'), text: t(`${base}.haru`) },
    ...(options.companion && companionText ? [{ speaker: options.companion.name, text: companionText }] : []),
    { text: t(`${base}.bag`) },
    { speaker: t('field.prologueFairy'), text: t(`${base}.next`) },
    { text: t(`${base}.chapterEnd`) },
  ];
}

/** 第六章の因果の流れを回復し、観測者Kの目的へ迫る東海終幕。 */
function tokaiIslandEpilogueLines(options: IslandEpilogueOptions): DialogueLine[] {
  const base = 'field.islandStory.tokai.epilogue';
  const companionText = options.companion
    ? (tOpt(`${base}.companion.${options.companion.id}`) ?? tOpt(`${base}.companion.default`))
    : undefined;
  return [
    { speaker: options.bossName, text: t(`${base}.bossTruth`) },
    { speaker: options.bossName, text: t(`${base}.bossClue`) },
    { speaker: t('field.prologueFairy'), text: t(`${base}.michiru`) },
    { speaker: options.playerName, text: t(`${base}.hero`) },
    { text: t(`${base}.restored`) },
    { speaker: t('field.storyHaru'), text: t(`${base}.haru`) },
    ...(options.companion && companionText ? [{ speaker: options.companion.name, text: companionText }] : []),
    { text: t(`${base}.bag`) },
    { speaker: t('field.prologueFairy'), text: t(`${base}.next`) },
    { text: t(`${base}.chapterEnd`) },
  ];
}

/** 第七章の分類の壁を開き、観測者Kの記録改変へ迫る近畿終幕。 */
function kinkiIslandEpilogueLines(options: IslandEpilogueOptions): DialogueLine[] {
  const base = 'field.islandStory.kinki.epilogue';
  const companionText = options.companion
    ? (tOpt(`${base}.companion.${options.companion.id}`) ?? tOpt(`${base}.companion.default`))
    : undefined;
  return [
    { speaker: options.bossName, text: t(`${base}.bossTruth`) },
    { speaker: options.bossName, text: t(`${base}.bossClue`) },
    { speaker: t('field.prologueFairy'), text: t(`${base}.michiru`) },
    { speaker: options.playerName, text: t(`${base}.hero`) },
    { text: t(`${base}.restored`) },
    { speaker: t('field.storyHaru'), text: t(`${base}.haru`) },
    ...(options.companion && companionText ? [{ speaker: options.companion.name, text: companionText }] : []),
    { text: t(`${base}.bag`) },
    { speaker: t('field.prologueFairy'), text: t(`${base}.next`) },
    { text: t(`${base}.chapterEnd`) },
  ];
}

/** 第八章の五つの証言を時系列へ戻し、名前ではなく行動からカナエの意図へ迫る中国終幕。 */
function chugokuIslandEpilogueLines(options: IslandEpilogueOptions): DialogueLine[] {
  const base = 'field.islandStory.chugoku.epilogue';
  const companionText = options.companion
    ? (tOpt(`${base}.companion.${options.companion.id}`) ?? tOpt(`${base}.companion.default`))
    : undefined;
  return [
    { speaker: options.bossName, text: t(`${base}.bossTruth`) },
    { speaker: options.bossName, text: t(`${base}.bossClue`) },
    { speaker: t('field.prologueFairy'), text: t(`${base}.michiru`) },
    { speaker: options.playerName, text: t(`${base}.hero`) },
    { text: t(`${base}.restored`) },
    { speaker: t('field.storyHaru'), text: t(`${base}.haru`) },
    ...(options.companion && companionText ? [{ speaker: options.companion.name, text: companionText }] : []),
    { text: t(`${base}.bag`) },
    { speaker: t('field.prologueFairy'), text: t(`${base}.next`) },
    { text: t(`${base}.chapterEnd`) },
  ];
}

/** 第九章で意図・手段・結果・責任を分け、カナエの選択を最終章へ持ち越す四国終幕。 */
function shikokuIslandEpilogueLines(options: IslandEpilogueOptions): DialogueLine[] {
  const base = 'field.islandStory.shikoku.epilogue';
  const companionText = options.companion
    ? (tOpt(`${base}.companion.${options.companion.id}`) ?? tOpt(`${base}.companion.default`))
    : undefined;
  return [
    { speaker: options.bossName, text: t(`${base}.bossTruth`) },
    { speaker: options.bossName, text: t(`${base}.bossClue`) },
    { speaker: t('field.prologueFairy'), text: t(`${base}.michiru`) },
    { speaker: options.playerName, text: t(`${base}.hero`) },
    { text: t(`${base}.restored`) },
    { speaker: t('field.storyHaru'), text: t(`${base}.haru`) },
    ...(options.companion && companionText ? [{ speaker: options.companion.name, text: companionText }] : []),
    { text: t(`${base}.bag`) },
    { speaker: t('field.prologueFairy'), text: t(`${base}.next`) },
    { text: t(`${base}.chapterEnd`) },
  ];
}

/** 最終章で8つのカギを結び、壺の知識を日本のみんなへかえす日本編終幕。 */
function kyushuOkinawaIslandEpilogueLines(options: IslandEpilogueOptions): DialogueLine[] {
  const base = 'field.islandStory.kyushuOkinawa.epilogue';
  const companionText = options.companion
    ? (tOpt(`${base}.companion.${options.companion.id}`) ?? tOpt(`${base}.companion.default`))
    : undefined;
  return [
    { speaker: options.bossName, text: t(`${base}.bossTruth`) },
    { speaker: options.bossName, text: t(`${base}.bossMichiru`) },
    { speaker: t('field.prologueFairy'), text: t(`${base}.michiru`) },
    { speaker: options.playerName, text: t(`${base}.hero`) },
    { speaker: t('field.storyHaru'), text: t(`${base}.haru`) },
    ...(options.companion && companionText ? [{ speaker: options.companion.name, text: companionText }] : []),
    { text: t(`${base}.kanae`) },
    { text: t(`${base}.vessel`) },
    { text: t(`${base}.people`) },
    { speaker: t('field.prologueFairy'), text: t(`${base}.michiruClue`) },
    { speaker: options.playerName, text: t(`${base}.promise`) },
    { text: t(`${base}.chapterEnd`) },
  ];
}

/** 島ごとの終幕へ振り分ける。 */
export function islandEpilogueLines(islandId: string, options: IslandEpilogueOptions): DialogueLine[] {
  if (islandId === 'tohoku') return tohokuIslandEpilogueLines(options);
  if (islandId === 'hokkaido') return hokkaidoIslandEpilogueLines(options);
  if (islandId === 'kanto') return kantoIslandEpilogueLines(options);
  if (islandId === 'hokuriku') return hokurikuIslandEpilogueLines(options);
  if (islandId === 'koshinetsu') return koshinetsuIslandEpilogueLines(options);
  if (islandId === 'tokai') return tokaiIslandEpilogueLines(options);
  if (islandId === 'kinki') return kinkiIslandEpilogueLines(options);
  if (islandId === 'chugoku') return chugokuIslandEpilogueLines(options);
  if (islandId === 'shikoku') return shikokuIslandEpilogueLines(options);
  if (islandId === 'kyushu-okinawa') return kyushuOkinawaIslandEpilogueLines(options);
  return [];
}
