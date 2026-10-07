import type { GameState } from '../../core/state/schema';
import type { StoryCompanionId } from '../../core/progression/storyCompanion';
import type { DialogueLine } from '../../ui/dialogue';
import { t } from '../../ui/i18n';

/** 名前を聞く前に、主人公が目覚めてミチルと出会う導入。 */
export function prologuePreludeLines(): DialogueLine[] {
  return [
    { speaker: t('field.prologueNarrator'), text: t('field.prologueWake') },
    { speaker: t('field.prologueFairy'), text: t('field.prologueFairyArrives') },
    { speaker: t('field.prologueFairy'), text: t('field.prologueFairyName') },
  ];
}

/** 名前を決めたあと、その名前で会話を続けるプロローグ本編。 */
export function prologueLines(game: GameState): DialogueLine[] {
  return [
    { speaker: game.player.name, text: t('field.prologueLost') },
    { speaker: t('field.prologueFairy'), text: t('field.prologueKnowledge') },
    { speaker: t('field.prologueFairy'), text: t('field.prologueWasuremono') },
    { speaker: t('field.prologueFairy'), text: t('field.prologueQuest') },
    { speaker: game.player.name, text: t('field.prologueResolve') },
    { text: t('field.prologueStart') },
  ];
}

export function companionChoiceLines(): DialogueLine[] {
  return [
    { speaker: t('field.musubiKeeper'), text: t('field.manabimonoExplain') },
    { speaker: t('field.prologueFairy'), text: t('field.wasuremonoExplain') },
    { speaker: t('field.musubiKeeper'), text: t('field.musubiExplain') },
    { speaker: t('field.musubiKeeper'), text: t('field.companionChoose') },
  ];
}

export function iwateArrivalLines(): DialogueLine[] {
  return [
    { speaker: t('field.prologueFairy'), text: t('field.iwateArrival') },
    { speaker: t('field.prologueFairy'), text: t('field.iwateStone') },
    { speaker: t('field.prologueFairy'), text: t('field.iwateShrineGuide') },
  ];
}

export type TohokuTownStoryArea = 'aomori' | 'miyagi' | 'akita' | 'yamagata' | 'fukushima' | 'hokkaido';
export type KantoTownStoryArea = 'ibaraki' | 'tochigi' | 'gunma' | 'saitama' | 'chiba' | 'tokyo' | 'kanagawa';
export type HokurikuTownStoryArea = 'niigata' | 'toyama' | 'ishikawa' | 'fukui';
export type KoshinetsuTownStoryArea = 'yamanashi' | 'nagano';
export type TokaiTownStoryArea = 'gifu' | 'shizuoka' | 'aichi' | 'mie';
export type KinkiTownStoryArea = 'shiga' | 'kyoto' | 'osaka' | 'hyogo' | 'nara' | 'wakayama';
export type ChugokuTownStoryArea = 'tottori' | 'shimane' | 'okayama' | 'hiroshima' | 'yamaguchi';
export type ShikokuTownStoryArea = 'tokushima' | 'kagawa' | 'ehime' | 'kochi';
export type KyushuOkinawaTownStoryArea =
  'fukuoka' | 'saga' | 'nagasaki' | 'kumamoto' | 'oita' | 'miyazaki' | 'kagoshima' | 'okinawa';
export type StoryTownArea =
  | TohokuTownStoryArea
  | KantoTownStoryArea
  | HokurikuTownStoryArea
  | KoshinetsuTownStoryArea
  | TokaiTownStoryArea
  | KinkiTownStoryArea
  | ChugokuTownStoryArea
  | ShikokuTownStoryArea
  | KyushuOkinawaTownStoryArea;

/** 東北の結界を越え、第二章へ入る瞬間。 */
export function hokkaidoChapterArrivalLines(game: GameState): DialogueLine[] {
  return [
    { text: t('field.hokkaidoChapterArrival.sea') },
    { speaker: t('field.storyHaru'), text: t('field.hokkaidoChapterArrival.haru') },
    { speaker: t('field.prologueFairy'), text: t('field.hokkaidoChapterArrival.michiru') },
    { speaker: game.player.name, text: t('field.hokkaidoChapterArrival.hero') },
    { text: t('field.hokkaidoChapterArrival.title') },
  ];
}

/** 北海道で得た手がかりを追い、情報が激しく行き交う第三章へ入る。 */
export function kantoChapterArrivalLines(game: GameState): DialogueLine[] {
  return [
    { text: t('field.kantoChapterArrival.bell') },
    { speaker: t('field.storyHaru'), text: t('field.kantoChapterArrival.haru') },
    { speaker: t('field.prologueFairy'), text: t('field.kantoChapterArrival.michiru') },
    { speaker: game.player.name, text: t('field.kantoChapterArrival.hero') },
    { text: t('field.kantoChapterArrival.title') },
  ];
}

/** 消された記録の痕跡を追い、推測と証拠を分けて復元する第四章へ入る。 */
export function hokurikuChapterArrivalLines(game: GameState): DialogueLine[] {
  return [
    { text: t('field.hokurikuChapterArrival.mirror') },
    { speaker: t('field.storyHaru'), text: t('field.hokurikuChapterArrival.haru') },
    { speaker: t('field.prologueFairy'), text: t('field.hokurikuChapterArrival.michiru') },
    { speaker: game.player.name, text: t('field.hokurikuChapterArrival.hero') },
    { text: t('field.hokurikuChapterArrival.title') },
  ];
}

/** 山越えの二つの視点を重ね、仮説を確かめる第五章へ入る。 */
export function koshinetsuChapterArrivalLines(game: GameState): DialogueLine[] {
  return [
    { text: t('field.koshinetsuChapterArrival.paper') },
    { speaker: t('field.storyHaru'), text: t('field.koshinetsuChapterArrival.haru') },
    { speaker: t('field.prologueFairy'), text: t('field.koshinetsuChapterArrival.michiru') },
    { speaker: game.player.name, text: t('field.koshinetsuChapterArrival.hero') },
    { text: t('field.koshinetsuChapterArrival.title') },
  ];
}

/** 山から海まで因果の流れを追い、仕組みを直す第六章へ入る。 */
export function tokaiChapterArrivalLines(game: GameState): DialogueLine[] {
  return [
    { text: t('field.tokaiChapterArrival.water') },
    { speaker: t('field.storyHaru'), text: t('field.tokaiChapterArrival.haru') },
    { speaker: t('field.prologueFairy'), text: t('field.tokaiChapterArrival.michiru') },
    { speaker: game.player.name, text: t('field.tokaiChapterArrival.hero') },
    { text: t('field.tokaiChapterArrival.title') },
  ];
}

/** 六つに分類された記録の関係を結びなおす第七章へ入る。 */
export function kinkiChapterArrivalLines(game: GameState): DialogueLine[] {
  return [
    { text: t('field.kinkiChapterArrival.keys') },
    { speaker: t('field.storyHaru'), text: t('field.kinkiChapterArrival.haru') },
    { speaker: t('field.prologueFairy'), text: t('field.kinkiChapterArrival.michiru') },
    { speaker: game.player.name, text: t('field.kinkiChapterArrival.hero') },
    { text: t('field.kinkiChapterArrival.title') },
  ];
}

/** 同じ一日を語る五つの証言を照合し、名前だけで人を裁かない第八章へ入る。 */
export function chugokuChapterArrivalLines(game: GameState): DialogueLine[] {
  return [
    { text: t('field.chugokuChapterArrival.voices') },
    { speaker: t('field.storyHaru'), text: t('field.chugokuChapterArrival.haru') },
    { speaker: t('field.prologueFairy'), text: t('field.chugokuChapterArrival.michiru') },
    { speaker: game.player.name, text: t('field.chugokuChapterArrival.hero') },
    { text: t('field.chugokuChapterArrival.title') },
  ];
}

/** 目的・手段・予測・責任を四つの天秤で考える第九章へ入る。 */
export function shikokuChapterArrivalLines(game: GameState): DialogueLine[] {
  return [
    { text: t('field.shikokuChapterArrival.scales') },
    { speaker: t('field.storyHaru'), text: t('field.shikokuChapterArrival.haru') },
    { speaker: t('field.prologueFairy'), text: t('field.shikokuChapterArrival.michiru') },
    { speaker: game.player.name, text: t('field.shikokuChapterArrival.hero') },
    { text: t('field.shikokuChapterArrival.title') },
  ];
}

/** 集めた方法を八つの鍵へ変え、壺と魔王へ向かう最終章へ入る。 */
export function kyushuOkinawaChapterArrivalLines(game: GameState): DialogueLine[] {
  return [
    { text: t('field.kyushuOkinawaChapterArrival.castle') },
    { speaker: t('field.storyHaru'), text: t('field.kyushuOkinawaChapterArrival.haru') },
    { speaker: t('field.prologueFairy'), text: t('field.kyushuOkinawaChapterArrival.michiru') },
    { speaker: game.player.name, text: t('field.kyushuOkinawaChapterArrival.hero') },
    { text: t('field.kyushuOkinawaChapterArrival.title') },
  ];
}

/** 各地を点ではなく一本の旅として見せる、シオリの見聞帳イベント。 */
export function tohokuTownArrivalLines(area: StoryTownArea, game: GameState): DialogueLine[] {
  const haru = t('field.storyHaru');
  switch (area) {
    case 'aomori':
      return [
        { speaker: haru, text: t('field.townStory.aomori.meet') },
        { speaker: game.player.name, text: t('field.townStory.aomori.blank') },
        { speaker: haru, text: t('field.townStory.aomori.journal') },
        { speaker: t('field.prologueFairy'), text: t('field.townStory.aomori.promise') },
        { text: t('field.townStory.aomori.page') },
      ];
    case 'miyagi':
      return [
        { speaker: haru, text: t('field.townStory.miyagi.reunion') },
        { speaker: t('field.prologueFairy'), text: t('field.townStory.miyagi.route') },
        { speaker: haru, text: t('field.townStory.miyagi.delivery') },
        { speaker: game.player.name, text: t('field.townStory.miyagi.resolve') },
        { text: t('field.townStory.miyagi.page') },
      ];
    case 'akita':
      return [
        { speaker: haru, text: t('field.townStory.akita.snow') },
        { speaker: game.player.name, text: t('field.townStory.akita.share') },
        { speaker: haru, text: t('field.townStory.akita.knowledge') },
        { speaker: t('field.prologueFairy'), text: t('field.townStory.akita.shadow') },
        { text: t('field.townStory.akita.page') },
      ];
    case 'yamagata':
      return [
        { speaker: haru, text: t('field.townStory.yamagata.words') },
        { speaker: t('field.prologueFairy'), text: t('field.townStory.yamagata.memory') },
        { speaker: game.player.name, text: t('field.townStory.yamagata.listen') },
        { speaker: haru, text: t('field.townStory.yamagata.record') },
        { text: t('field.townStory.yamagata.page') },
      ];
    case 'fukushima':
      return [
        { speaker: haru, text: t('field.townStory.fukushima.pages') },
        { speaker: game.player.name, text: t('field.townStory.fukushima.history') },
        { speaker: haru, text: t('field.townStory.fukushima.future') },
        { speaker: t('field.prologueFairy'), text: t('field.townStory.fukushima.castle') },
        { text: t('field.townStory.fukushima.page') },
      ];
    case 'hokkaido':
      return [
        { speaker: haru, text: t('field.townStory.hokkaido.map') },
        { speaker: game.player.name, text: t('field.townStory.hokkaido.scale') },
        { speaker: t('field.prologueFairy'), text: t('field.townStory.hokkaido.seasons') },
        { speaker: haru, text: t('field.townStory.hokkaido.measure') },
        { text: t('field.townStory.hokkaido.page') },
      ];
    case 'ibaraki':
      return storyTownLines(area, game, ['rumor', 'question', 'research', 'resolve', 'page']);
    case 'tochigi':
      return storyTownLines(area, game, ['notice', 'compare', 'voices', 'resolve', 'page']);
    case 'gunma':
      return storyTownLines(area, game, ['warning', 'number', 'context', 'resolve', 'page']);
    case 'saitama':
      return storyTownLines(area, game, ['money', 'trust', 'record', 'resolve', 'page']);
    case 'chiba':
      return storyTownLines(area, game, ['map', 'measure', 'error', 'resolve', 'page']);
    case 'tokyo':
      return storyTownLines(area, game, ['noise', 'source', 'speed', 'resolve', 'page']);
    case 'kanagawa':
      return storyTownLines(area, game, ['port', 'translation', 'context', 'resolve', 'page']);
    case 'niigata':
      return storyTownLines(area, game, ['river', 'blank', 'layers', 'resolve', 'page']);
    case 'toyama':
      return storyTownLines(area, game, ['ledger', 'missing', 'trace', 'resolve', 'page']);
    case 'ishikawa':
      return storyTownLines(area, game, ['craft', 'repair', 'difference', 'resolve', 'page']);
    case 'fukui':
      return storyTownLines(area, game, ['fossil', 'pieces', 'guess', 'resolve', 'page']);
    case 'yamanashi':
      return storyTownLines(area, game, ['mountain', 'reflection', 'viewpoint', 'resolve', 'page']);
    case 'nagano':
      return storyTownLines(area, game, ['pass', 'maps', 'scale', 'resolve', 'page']);
    case 'gifu':
      return storyTownLines(area, game, ['river', 'upstream', 'link', 'resolve', 'page']);
    case 'shizuoka':
      return storyTownLines(area, game, ['tea', 'weather', 'chain', 'resolve', 'page']);
    case 'aichi':
      return storyTownLines(area, game, ['factory', 'parts', 'system', 'resolve', 'page']);
    case 'mie':
      return storyTownLines(area, game, ['sea', 'current', 'downstream', 'resolve', 'page']);
    case 'shiga':
      return storyTownLines(area, game, ['lake', 'borders', 'relation', 'resolve', 'page']);
    case 'kyoto':
      return storyTownLines(area, game, ['scroll', 'labels', 'context', 'resolve', 'page']);
    case 'osaka':
      return storyTownLines(area, game, ['market', 'boxes', 'routes', 'resolve', 'page']);
    case 'hyogo':
      return storyTownLines(area, game, ['port', 'languages', 'links', 'resolve', 'page']);
    case 'nara':
      return storyTownLines(area, game, ['tablets', 'eras', 'continuity', 'resolve', 'page']);
    case 'wakayama':
      return storyTownLines(area, game, ['pilgrims', 'purposes', 'paths', 'resolve', 'page']);
    case 'tottori':
      return storyTownLines(area, game, ['sand', 'footprints', 'time', 'resolve', 'page']);
    case 'shimane':
      return storyTownLines(area, game, ['tide', 'promise', 'witness', 'resolve', 'page']);
    case 'okayama':
      return storyTownLines(area, game, ['bridge', 'schedule', 'gap', 'resolve', 'page']);
    case 'hiroshima':
      return storyTownLines(area, game, ['letter', 'copies', 'difference', 'resolve', 'page']);
    case 'yamaguchi':
      return storyTownLines(area, game, ['cave', 'echo', 'sequence', 'resolve', 'page']);
    case 'tokushima':
      return storyTownLines(area, game, ['dance', 'purpose', 'consent', 'resolve', 'page']);
    case 'kagawa':
      return storyTownLines(area, game, ['water', 'means', 'cost', 'resolve', 'page']);
    case 'ehime':
      return storyTownLines(area, game, ['route', 'forecast', 'risk', 'resolve', 'page']);
    case 'kochi':
      return storyTownLines(area, game, ['storm', 'result', 'repair', 'resolve', 'page']);
    case 'fukuoka':
      return storyTownLines(area, game, ['gate', 'question', 'key', 'resolve', 'page']);
    case 'saga':
      return storyTownLines(area, game, ['kiln', 'fragments', 'pattern', 'resolve', 'page']);
    case 'nagasaki':
      return storyTownLines(area, game, ['port', 'languages', 'translation', 'resolve', 'page']);
    case 'kumamoto':
      return storyTownLines(area, game, ['walls', 'damage', 'support', 'resolve', 'page']);
    case 'oita':
      return storyTownLines(area, game, ['steam', 'pressure', 'release', 'resolve', 'page']);
    case 'miyazaki':
      return storyTownLines(area, game, ['cave', 'story', 'decision', 'resolve', 'page']);
    case 'kagoshima':
      return storyTownLines(area, game, ['volcano', 'warning', 'evacuation', 'resolve', 'page']);
    case 'okinawa':
      return storyTownLines(area, game, ['sea', 'voices', 'promise', 'resolve', 'page']);
  }
}

function storyTownLines(
  area:
    | KantoTownStoryArea
    | HokurikuTownStoryArea
    | KoshinetsuTownStoryArea
    | TokaiTownStoryArea
    | KinkiTownStoryArea
    | ChugokuTownStoryArea
    | ShikokuTownStoryArea
    | KyushuOkinawaTownStoryArea,
  game: GameState,
  keys: readonly string[],
): DialogueLine[] {
  const speakers = [t('field.storyHaru'), game.player.name, t('field.prologueFairy'), t('field.storyHaru')];
  return keys.map((key, index) => ({
    speaker: index < speakers.length ? speakers[index] : undefined,
    text: t(`field.townStory.${area}.${key}`),
  }));
}

export function companionJoinedLines(monsterId: StoryCompanionId, name: string): DialogueLine[] {
  return [
    { speaker: name, text: t(`field.companionVoice.${monsterId}`) },
    { text: t('field.companionJoined', { name }) },
    { speaker: t('field.musubiKeeper'), text: t('field.companionKeeperLesson', { name }) },
    { speaker: name, text: t(`field.companionPromise.${monsterId}`) },
    { speaker: t('field.prologueFairy'), text: t('field.companionJourney') },
    { text: t('field.companionIwatePage', { name }) },
  ];
}
