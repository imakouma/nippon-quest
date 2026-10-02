/**
 * フィールド・町・ダンジョン・離島（docs/02 Step 4）。
 *  - 主人公は全身の歩行ドット絵（16×24、4 方向×3 コマ）。1 マスずつ歩く（キー / タッチでおしっぱなし）
 *  - 名所（イベント・名所スタンプ）は近づくと自動で始まる（GDD §7）。カットイン → 会話 → 問題 → ごほうび
 *  - 名所の ★ 看板は ★ の色で進みぐあいを見せる：灰色＝まだ見つけていない、白＋「！」＝チャレンジがまだ、
 *    金色＝ぜんぶ終わった。看板・入口・中ボスなどの上に名前の札（ポップアップ）は出さない
 *  - 中ボスはフィールドの決まった場所に立ちふさがる。倒すとそのマスに次の県へのワープホールが開く
 *  - 県ボスはダンジョンの おくの へや（さいだんの 前）に立つ。見た目は中ボスと同じ「？」。倒すと 県のしるし
 *  - 県はそれぞれ海にかこまれた島。地方（島）の全体は「にほんちず」で見る（歩ける地方マップは無い）
 *  - 文字はすべてドットフォント（PixelMplus12、12px の倍数）
 * 物理エンジンは使わない（マスで判定する）。※以前は Arcade Physics の「世界の端」が 960×540 のままで、
 *   縦 540px をこえるマップでは主人公がそこで押し戻され、南へ進めなかった。
 */
import Phaser from 'phaser';
import { h, render, type ComponentChild } from 'preact';
import type { ContentIndex } from '../core/content/loader';
import type { Area, AreaEvent, Item, Monster, Motif, Reward } from '../core/content/schemas';
import { makeMonster } from '../core/battle/factory';
import {
  encounterLevel,
  partyFromGameState,
  pickEncounter,
  zoneForGround,
  zoneForMap,
} from '../core/battle/setup';
import { groundOfTile, type Ground } from '../core/world/ground';
import { evolutionOf, evolve, skillChanges } from '../core/progression/evolution';
import {
  adjacencyBonus,
  bagContext,
  bagMonsterUids,
  bagUsage,
  evolveRoom,
  moveBagThing,
  monsterCost,
  monsterSize,
  nextSlotLevel,
  putEquip,
  removeFromRoster,
  setLeader,
  toggleBagMonster,
} from '../core/progression/bag';
import { heroLevel } from '../core/progression/battleResult';
import { canUse, EQUIP_SLOTS, isEquip, unequip, useItem } from '../core/progression/inventory';
import {
  acceptMission,
  canCraft,
  claimDexReward,
  completeMission,
  craft,
  DEX_STEP,
  dexProgress,
  giftKey,
  INN_PRICE,
  innRest,
  knownRecipes,
  missionProgress,
  missionsFor,
  missionStatus,
  shopStock,
  buyItem,
  villagerGift,
  villagerMotif,
  type MissionStatus,
} from '../core/progression/town';
import {
  applyReward,
  earnAreaSign,
  markDone,
  pickReward,
  type RewardLine,
} from '../core/progression/eventReward';
import {
  areaBossFlag,
  lastBossFlag,
  midBossFlag,
  motifStamp,
  nextStop,
  type NextStop,
} from '../core/progression/route';
import { createRng, freshSeed, type Rng } from '../core/rng';
import type { GameState } from '../core/state/schema';
import { MasteryStore, type QuestionBank } from '../questions/engine';
import { ENCLAVES } from '../../scripts/data/prefectures';
import { DialogueOverlay, type DialogueLine } from '../ui/dialogue';
import {
  AreaMapOverlay,
  type AreaMark,
  type AreaMapView,
  type PlaceOption,
  type RegionMiniView,
} from '../ui/field/AreaMap';
import { AreaTitle, FieldHud, LandmarkCutin } from '../ui/field/FieldUi';
import { BagOverlay, type BagThing } from '../ui/field/BagOverlay';
import { bagCells } from '../ui/field/bagLayout';
import { TownOverlay, type TownOverlayProps, type TownRow } from '../ui/field/TownOverlay';
import { MenuOverlay, type MenuEntry, type MenuTab, type RoadmapNode } from '../ui/field/MenuOverlay';
import { ParentOverlay } from '../ui/field/ParentOverlay';
import {
  WorldMapOverlay,
  type MapAreaInfo,
  type MapRegionInfo,
  type WorldMapData,
} from '../ui/field/WorldMapOverlay';
import { t } from '../ui/i18n';
import { createSpeaker } from '../ui/overlay';
import { QuestionFrame } from '../ui/QuestionFrame';
import { stripRuby } from '../ui/ruby';
import { playSfx } from '../ui/sfx';
import {
  CHAR_H,
  CHAR_W,
  DIRS,
  HERO_FEET_ORIGIN_Y,
  HERO_H,
  HERO_W,
  heroKey,
  heroLook,
  NPC_LOOKS,
  walkFrame,
  walkSheet,
  type Dir,
} from './art/characters';
import { itemIconUrl } from './art/itemIcons';
import { giveMeisan, meisanEarned } from '../core/progression/meisan';
import { motifArtUrl } from './art/motifArt';
import { monsterMenuArtUrl } from './art/menuArt';
import { addSheet } from './art/sheet';
import type { BattleEndPayload, BattleSceneData } from './Battle';
import { buildFieldTextures, WARP_FRAMES } from './overworld/fieldArt';
import { overworldView } from './overworld/overworldView';
import { buildViewTexture } from './overworld/viewTiles';
import { buildEntranceIcons } from './overworld/entranceIcons';
import { buildRoadmapNodes } from './overworld/roadmap';
import { askFirst, buildAskEnv, relaxedQueries } from './shared/askEnv';

const TILE = 16;
const STEP_MS = 160;
/** 3 倍（1 マス 48px。見える はんいを しぼって、ドラクエのように 1 つ 1 つを 大きく） */
const ZOOM = 3;
/** 止まってから 左上の 窓（場所の名前・★・小さな地図）が 出るまで */
const HUD_IDLE_MS = 700;
/** 人物の絵（16×24）の中で、マスの中心にあたる高さ（足もとがマスの下のふちに来る） */
const FEET_ORIGIN_Y = 16 / CHAR_H;
const DELTA: Record<Dir, [number, number]> = { down: [0, 1], left: [-1, 0], right: [1, 0], up: [0, -1] };
/** collision レイヤーでこの番号のマスは通れない（scripts/scaffold-maps.ts） */
const BLOCK_TILE = 3;
/** background の 水（海・湖）の タイル */
const WATER_TILE = 3;
/** 名所に「着いた」とみなす範囲（まわり 1 マス） */
const TRIGGER_RADIUS = 1;
/** にほんちずの地図データ（scripts/scaffold-maps.ts が public/worldmap.json に作る）の cache キー */
const WORLD_MAP_KEY = 'worldmap';
/** 特産品（イベントの無い たべもの・こうげいひん）は ★ 看板ではなく宝箱（scripts/scaffold-maps.ts） */
/** みため タブの 部位（GameState.player.appearance の キー と 文言の キー） */
type HeroLookIndex = GameState['player']['appearance'];
const LOOK_PARTS: readonly { part: 'hair' | 'skin' | 'cloth'; key: string }[] = [
  { part: 'hair', key: 'lookHair' },
  { part: 'skin', key: 'lookSkin' },
  { part: 'cloth', key: 'lookCloth' },
];

/** 図鑑の地理順。ストーリーの攻略順とは分け、北海道から沖縄へ北→南に並べる。 */
const GEOGRAPHIC_AREA_ORDER = [
  'hokkaido',
  'aomori',
  'iwate',
  'miyagi',
  'akita',
  'yamagata',
  'fukushima',
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
] as const;

const SPECIALTY_KINDS: ReadonlySet<Motif['kind']> = new Set(['food', 'craft']);
const MOTIF_KIND_KEY: Record<Motif['kind'], string> = {
  landmark: 'field.motifLandmark',
  food: 'field.motifFood',
  craft: 'field.motifCraft',
  nature: 'field.motifNature',
  festival: 'field.motifFestival',
  history: 'field.motifHistory',
};

interface DebugBattle {
  enemyId: string;
  level: number;
  zone?: 'field' | 'dungeon';
  /** バトルの 背景を 見る ための 地面 */
  ground?: Ground;
}

interface OverworldSceneData {
  mapKey?: string;
  spawnName?: string;
  /** 地図のワープ：このマス（のとなりの歩けるマス）に立つ。spawnName より優先 */
  spawnTile?: [number, number];
  exactSpawn?: boolean;
  /** ?debug=battle のとき、マップに入ってすぐバトルを始める */
  debugBattle?: DebugBattle | null;
}

interface TiledProperty {
  name: string;
  value: unknown;
}

type TiledObject = Phaser.Types.Tilemaps.TiledObject;

/** cache に入っている Tiled JSON のうち、地図に使うところ */
interface RawTiledMap {
  width: number;
  height: number;
  layers: { name: string; data?: number[]; objects?: TiledObject[] }[];
}

/** 地図に出すマップ（県のフィールド。島にいるときは その島） */
interface BaseMap {
  key: string;
  /** 地図の名前（RubyText） */
  name: string;
  width: number;
  height: number;
  tiles: number[];
  objects: TiledObject[];
  /** 陸（海以外）のタイルの範囲 [x0, y0, x1, y1] */
  land: [number, number, number, number] | null;
}

/** ワープ先。PlaceOption（画面に出す分）＋ 行き先 */
interface Place extends PlaceOption {
  map: string;
  spawn: string;
  tile?: [number, number];
}
type MapKind = 'field' | 'town' | 'dungeon' | 'enclave' | 'secret';
type RootName = 'hud' | 'title' | 'fx' | 'dialogue' | 'travel';

interface FieldTrigger {
  id: string;
  /** 近づいただけで始めるか（once のイベント・取ったスタンプは false） */
  auto: () => boolean;
  run: () => Promise<void>;
}

interface Npc {
  /** マップの物体の名前（npc_talk_1 など。おみやげを もらったかの しるしに使う） */
  key: string;
  /** しごと（shop / inn / smith / board / dex / arena / talk） */
  role: string;
  name: string;
  lines: DialogueLine[];
  sprite: Phaser.GameObjects.Sprite;
  /** 港の せんどうさん：のせてくれる 船の 行き先（place は 行き先の 名前） */
  ferry?: { map: string; spawn: string; place: string; back: boolean };
}

interface Chest {
  key: string;
  itemId: string;
  itemName: string;
  count: number;
  sprite: Phaser.GameObjects.Image;
  /** 特産品の宝箱（あけると 特産品の説明が出て、その特産品が もらえる） */
  specialty?: { area: Area; motif: Motif; stamp: string };
}

interface MidBoss {
  tile: number;
  def: Monster;
  parts: Phaser.GameObjects.GameObject[];
  /** オーラの光のつぶを出しつづけるタイマー */
  sparks: Phaser.Time.TimerEvent;
}

interface Warp {
  tile: number;
  to: NextStop;
  toName: string;
}

/** 名所の ★ 看板 */
interface Sign {
  /** dex.motifs に入る名所スタンプ。持っている＝その名所を見つけた */
  stamp: string;
  found: () => boolean;
  /** 見つけた・チャレンジを終えた あとに、★ の色と「！」をいまの進みぐあいに合わせる */
  refresh: () => void;
}

/** content に 名前の無い お店の人は、役わりの名前で よぶ */
const ROLE_NAME_KEYS: Record<string, string> = {
  shop: 'field.roleShop',
  inn: 'field.roleInn',
  smith: 'field.roleSmith',
  board: 'field.roleBoard',
  dex: 'field.roleDex',
  arena: 'field.roleArena',
  ferry: 'field.roleFerry',
};

/** 町の人（talk）の しごとの名前。はなす モチーフの しゅるいで きまる */
const JOB_NAME_KEYS: Record<Motif['kind'], string> = {
  food: 'field.jobFood',
  craft: 'field.jobCraft',
  landmark: 'field.jobLandmark',
  nature: 'field.jobNature',
  festival: 'field.jobFestival',
  history: 'field.jobHistory',
};
/** 開発者モード（ぜんぶの 場所へ ワープ）の しるし。セーブの progress.counters に 1 */
const DEV_ALL_KEY = 'dev:all';
/** たいせんじょうで かったときの しょうきん（ふつうの ごほうびの ほかに） */
const ARENA_PRIZE = 60;

const prop = (obj: TiledObject, name: string): unknown =>
  ((obj.properties ?? []) as TiledProperty[]).find((p) => p.name === name)?.value;
const kana = (ruby: string): string => stripRuby(ruby, 'kana');

export class OverworldScene extends Phaser.Scene {
  private mapKey = 'aomori-field';
  private spawnName = 'spawn';
  private spawnTile: [number, number] | null = null;
  private exactSpawn = false;
  private pendingDebugBattle: DebugBattle | null = null;
  private map!: Phaser.Tilemaps.Tilemap;
  private colLayer: Phaser.Tilemaps.TilemapLayer | null = null;
  private player!: Phaser.GameObjects.Sprite;
  private shadow!: Phaser.GameObjects.Image;
  private heroTex = '';
  private facing: Dir = 'down';
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd?: Record<'W' | 'A' | 'S' | 'D', Phaser.Input.Keyboard.Key>;
  private rng: Rng = createRng(freshSeed());
  private readonly speak = createSpeaker();
  private readonly roots = new Map<RootName, HTMLDivElement>();
  // ↓ マップが変わるたびに resetMapState() で作り直す
  private moving = false;
  private busy = false;
  private inBattle = false;
  private canWarp = false;
  private waitRelease = false;
  private inputLockUntil = 0;
  private lastBump = 0;
  private stepCount = 0;
  private blocked = new Set<number>();
  private transitions = new Map<number, { map: string; spawn: string }>();
  private triggers = new Map<number, FieldTrigger>();
  private insideTrigger: string | null = null;
  private signs = new Map<number, () => Promise<void>>();
  private npcs = new Map<number, Npc>();
  private chests = new Map<number, Chest>();
  private midBoss: MidBoss | null = null;
  private warp: Warp | null = null;
  private pendingMidBoss = false;
  /** ダンジョンの おくに いる 県ボス（中ボスと同じ「？」マーク） */
  /** 止まっているか（左上の 窓を 出す）。歩きだすと かくし、HUD_IDLE_MS 止まると 出す */
  private hudIdle = true;
  private hudIdleTimer: Phaser.Time.TimerEvent | null = null;
  /** 裏ステージの ラスボス（歴史上の 人物） */
  private lastBoss: MidBoss | null = null;
  private pendingLastBoss = false;
  /** かぎの かかった 入口（マス → 何で ひらくか。'areaSign' は その県の 県ボスを 倒すと） */
  private lockedGates = new Map<number, string>();
  private areaBoss: MidBoss | null = null;
  private pendingAreaBoss = false;
  /** 右上の 表示に 出している 地面（かわったら かきなおす） */
  /** たいせんじょうの しょうぶ中（かったら しょうきん）。値は 船長の名前 */
  private pendingArena: string | null = null;
  private stampIds: string[] = [];
  private baseMap: BaseMap | null = null;

  constructor() {
    super('Overworld');
  }

  init(data?: OverworldSceneData): void {
    if (data?.mapKey) this.mapKey = data.mapKey;
    this.spawnName = data?.spawnName ?? 'spawn';
    this.spawnTile = data?.spawnTile ?? null;
    this.exactSpawn = data?.exactSpawn ?? false;
    this.pendingDebugBattle = data?.debugBattle ?? null;
  }

  preload(): void {
    buildFieldTextures(this);
    const base = import.meta.env.BASE_URL.replace(/\/$/, '');
    this.load.tilemapTiledJSON(this.mapKey, `${base}/maps/${this.mapKey}.json`);
    // 町・ダンジョンの中でも、左上の地図には その県のフィールドを出す
    const bk = this.baseKey();
    if (bk !== this.mapKey && !this.cache.tilemap.exists(bk))
      this.load.tilemapTiledJSON(bk, `${base}/maps/${bk}.json`);
    if (!this.cache.json.exists(WORLD_MAP_KEY)) this.load.json(WORLD_MAP_KEY, `${base}/worldmap.json`);
  }

  create(): void {
    this.resetMapState();
    for (const r of ['hud', 'title', 'fx', 'dialogue', 'travel'] as const) this.root(r);

    const onBattleEnd = (p: BattleEndPayload) => this.onBattleEnd(p);
    this.game.events.on('battle:end', onBattleEnd);
    // タブが うしろに あると Phaser の カメラの フェードも 時間も 止まり、黒い まくが かかった ままに なる。
    // 画面に もどってきたら 消す（Phaser の タイマーは 止まるので、DOM の イベントで 受ける）
    const onVisible = () => this.clearStuckFade();
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onVisible);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.game.events.off('battle:end', onBattleEnd);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onVisible);
      for (const r of ['title', 'fx', 'dialogue', 'travel'] as const) render(null, this.root(r));
    });

    this.map = this.make.tilemap({ key: this.mapKey });
    const tileset = this.map.addTilesetImage('overworld-tiles', 'overworld-tiles');
    if (!tileset) {
      console.error('[Overworld] タイルセットを読み込めません');
      return;
    }
    this.map.createLayer('background', tileset, 0, 0);
    // フィールド・離島は 見た目用の レイヤーを 上に しく（データの background は そのまま。地面の 判定に つかう）
    if (this.kind() === 'field' || this.kind() === 'enclave') this.addViewLayer();
    // 町・ダンジョンの 木・かざり・たいまつ など（地面の上に重ねる）
    if (this.map.getLayer('decor')) this.map.createLayer('decor', tileset, 0, 0);
    this.colLayer = this.map.createLayer('collision', tileset, 0, 0);
    this.colLayer?.setVisible(this.map.getLayer('collision')?.visible ?? true);

    const objects = this.map.getObjectLayer('objects');
    const [sx, sy] = this.findSpawn(objects);
    this.createHero(sx, sy);
    this.setupObjects(objects);
    this.insideTrigger = this.triggers.get(this.idx(sx, sy))?.id ?? null;

    const cam = this.cameras.main;
    cam.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
    cam.setZoom(ZOOM);
    cam.setRotation(0);
    cam.startFollow(this.player, true, 0.2, 0.2);
    // 前の 画面の フェードが のこっていたら 消してから 明るくする
    cam.resetFX();
    cam.fadeIn(250, 0, 0, 0);
    // フェードが 止まった ままでも 黒い まくが のこらないように（window の タイマーは タブが うしろでも 動く）
    const fadeGuard = window.setTimeout(() => this.clearStuckFade(), 800);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => window.clearTimeout(fadeGuard));

    this.setupInput();
    this.time.delayedCall(400, () => (this.canWarp = true));
    this.rememberLocation(sx, sy);
    this.markVisited();
    this.baseMap = this.readBaseMap();
    this.renderHud();
    if (!this.pendingDebugBattle) this.showPlaceTitle();

    const debug = this.pendingDebugBattle;
    if (debug) {
      this.pendingDebugBattle = null;
      const zone = debug.zone ?? zoneForMap(this.mapKey) ?? 'field';
      this.time.delayedCall(300, () =>
        this.startBattle({
          enemyId: debug.enemyId,
          level: debug.level,
          zone,
          ...(debug.ground ? { ground: debug.ground } : {}),
        }),
      );
    }
  }

  private resetMapState(): void {
    this.moving = false;
    this.busy = false;
    this.inBattle = false;
    this.canWarp = false;
    this.waitRelease = false;
    this.inputLockUntil = 0;
    this.stepCount = 0;
    this.blocked = new Set();
    this.transitions = new Map();
    this.triggers = new Map();
    this.insideTrigger = null;
    this.signs = new Map();
    this.npcs = new Map();
    this.chests = new Map();
    this.midBoss = null;
    this.warp = null;
    this.pendingMidBoss = false;
    this.areaBoss = null;
    this.pendingAreaBoss = false;
    this.lastBoss = null;
    this.pendingLastBoss = false;
    this.lockedGates = new Map();
    this.stampIds = [];
    this.baseMap = null;
  }

  // ───────────────────────── 主人公と移動 ─────────────────────────

  private findSpawn(layer: Phaser.Tilemaps.ObjectLayer | null): [number, number] {
    if (this.spawnTile) {
      if (this.exactSpawn) return this.spawnTile;
      // 地図のワープ：看板のマスではなく、となりの歩けるマスに立つ（下 → 左右 → 上 → そのマス）
      const [tx, ty] = this.spawnTile;
      for (const [dx, dy] of [
        [0, 1],
        [-1, 0],
        [1, 0],
        [0, -1],
        [0, 0],
      ] as const) {
        const x = tx + dx;
        const y = ty + dy;
        if (!this.inside(x, y) || this.colLayer?.getTileAt(x, y)?.index === BLOCK_TILE) continue;
        if (dy === 1) this.facing = 'up';
        return [x, y];
      }
      return [tx, ty];
    }
    const obj =
      layer?.objects.find((o) => o.name === this.spawnName) ??
      layer?.objects.find((o) => o.type === 'spawn' && o.name === 'spawn');
    let x = obj?.x ?? 96;
    let y = obj?.y ?? 240;
    if (obj && (obj.type === 'transition' || obj.name.startsWith('to_'))) y += TILE;
    x = Math.floor(x / TILE);
    y = Math.floor(y / TILE);
    return [Math.min(Math.max(0, x), this.map.width - 1), Math.min(Math.max(0, y), this.map.height - 1)];
  }

  private createHero(tx: number, ty: number): void {
    this.heroTex = this.heroSheet();
    const x = tx * TILE + 8;
    const y = ty * TILE + 8;
    this.shadow = this.add
      .image(x, y + 6, 'fld.shadow')
      .setAlpha(0.3)
      .setDepth(1);
    this.player = this.add
      .sprite(x, y, this.heroTex, walkFrame(this.facing, 1))
      .setOrigin(0.5, HERO_FEET_ORIGIN_Y);
    this.player.setDepth(y);
  }

  /**
   * 主人公の 歩行シート（見た目 と 着ている めいさんひんの そうびで きまる）を 用意して キーを かえす。
   * ap を わたすと その 見た目の 見本（みため タブ）
   */
  private heroSheet(ap?: HeroLookIndex): string {
    const gs = this.gs();
    const look = ap ?? gs?.player.appearance ?? { hair: 0, skin: 0, cloth: 0 };
    const eq = gs?.player.equipment ?? {};
    const key = heroKey(look, eq);
    addSheet(this.textures, key, walkSheet(heroLook(look, eq), true), HERO_W, HERO_H);
    this.ensureWalkAnims(key);
    return key;
  }

  /** 見た目・そうびが かわったら 歩いている 主人公の 絵を つけかえる */
  private refreshHeroLook(): void {
    if (!this.player?.active) return;
    const key = this.heroSheet();
    if (key === this.heroTex) return;
    this.heroTex = key;
    const walking = this.player.anims.isPlaying;
    this.player.setTexture(key, walkFrame(this.facing, 1));
    if (walking) this.player.anims.play(`${key}:${this.facing}`, true);
  }

  /** みための 見本（正面の 立ち絵）を data URL に */
  private heroFrameUrl(ap: HeroLookIndex): string {
    return this.textures.getBase64(this.heroSheet(ap), walkFrame('down', 1)) as string;
  }

  private ensureWalkAnims(tex: string): void {
    for (const d of DIRS) {
      const key = `${tex}:${d}`;
      if (this.anims.exists(key)) continue;
      this.anims.create({
        key,
        frames: ([0, 1, 2, 1] as const).map((c) => ({ key: tex, frame: walkFrame(d, c) })),
        frameRate: 10,
        repeat: -1,
      });
    }
  }

  private setupInput(): void {
    const kb = this.input.keyboard;
    if (kb) {
      this.cursors = kb.createCursorKeys();
      this.wasd = kb.addKeys('W,A,S,D') as Record<'W' | 'A' | 'S' | 'D', Phaser.Input.Keyboard.Key>;
      for (const ev of ['keydown-SPACE', 'keydown-ENTER', 'keydown-Z']) kb.on(ev, () => this.interact());
      kb.on('keydown-M', () => this.openAreaMap());
      kb.on('keydown-P', () => this.openBag());
      kb.on('keydown-B', () => this.openBag());
      kb.on('keydown-I', () => this.openMenu());
    }
    // タップ：主人公のすぐ近くなら「しらべる」。はなれた所をおしっぱなしにすると、その方向へ歩く（update）
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      if (this.busy || this.inBattle) return;
      const w = p.positionToCamera(this.cameras.main) as Phaser.Math.Vector2;
      if (Phaser.Math.Distance.Between(this.player.x, this.player.y - 4, w.x, w.y) < 20) this.interact();
    });
  }

  private readDir(): Dir | null {
    const c = this.cursors;
    const k = this.wasd;
    if (c?.left.isDown || k?.A.isDown) return 'left';
    if (c?.right.isDown || k?.D.isDown) return 'right';
    if (c?.up.isDown || k?.W.isDown) return 'up';
    if (c?.down.isDown || k?.S.isDown) return 'down';
    const p = this.input.activePointer;
    if (p.isDown && p.getDuration() > 150) {
      const w = p.positionToCamera(this.cameras.main) as Phaser.Math.Vector2;
      const dx = w.x - this.player.x;
      const dy = w.y - (this.player.y - 4);
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 12) return null;
      return Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : dy < 0 ? 'up' : 'down';
    }
    return null;
  }

  override update(): void {
    if (!this.player?.active) return;
    this.player.setDepth(this.player.y);
    this.shadow.setPosition(this.player.x, this.player.y + 6);
    if (this.inBattle || this.busy || this.moving) return;
    const dir = this.readDir();
    if (this.waitRelease) {
      // 会話を閉じたキーをおしたままでも、すぐに次の会話が始まらないように、いちど はなすまで待つ
      if (dir) return;
      this.waitRelease = false;
    }
    if (!dir) {
      this.standStill();
      return;
    }
    this.face(dir);
    const [x, y] = this.playerTile();
    const nx = x + DELTA[dir][0];
    const ny = y + DELTA[dir][1];
    if (!this.inside(nx, ny)) {
      this.standStill();
      return;
    }
    if (this.midBoss && this.idx(nx, ny) === this.midBoss.tile) {
      this.standStill();
      void this.confrontMidBoss();
      return;
    }
    if (this.areaBoss && this.idx(nx, ny) === this.areaBoss.tile) {
      this.standStill();
      void this.confrontAreaBoss();
      return;
    }
    if (this.lastBoss && this.idx(nx, ny) === this.lastBoss.tile) {
      this.standStill();
      void this.confrontLastBoss();
      return;
    }
    if (this.isBlocked(nx, ny)) {
      this.standStill();
      if (this.time.now - this.lastBump > 300) {
        this.lastBump = this.time.now;
        playSfx('bump');
      }
      return;
    }
    this.walkTo(nx, ny);
  }

  private walkTo(nx: number, ny: number): void {
    this.moving = true;
    // 歩いている あいだは 左上の 窓を かくす（止まると 出る。ドラクエの 窓のように）
    this.hudIdleTimer?.remove();
    if (this.hudIdle) {
      this.hudIdle = false;
      this.renderHud();
    }
    this.hudIdleTimer = this.time.delayedCall(HUD_IDLE_MS, () => {
      if (this.moving) return;
      this.hudIdle = true;
      this.renderHud();
    });
    this.player.anims.play(`${this.heroTex}:${this.facing}`, true);
    this.tweens.add({
      targets: this.player,
      x: nx * TILE + 8,
      y: ny * TILE + 8,
      duration: STEP_MS,
      onComplete: () => {
        this.moving = false;
        this.stepCount++;
        this.renderHud(); // 左上の地図の主人公を動かす
        this.arrive(nx, ny);
      },
    });
  }

  private face(dir: Dir): void {
    if (dir === this.facing) return;
    this.facing = dir;
    if (this.player.anims.isPlaying) this.player.anims.play(`${this.heroTex}:${dir}`, true);
    else this.player.setFrame(walkFrame(dir, 1));
  }

  private standStill(): void {
    if (this.player.anims.isPlaying) this.player.anims.stop();
    this.player.setFrame(walkFrame(this.facing, 1));
  }

  /** 1 マス歩き終えたとき：入口 → ワープホール → 名所 → エンカウント の順に調べる */
  private arrive(x: number, y: number): void {
    const i = this.idx(x, y);
    const tr = this.transitions.get(i);
    if (tr && this.canWarp && this.isLocked(i)) {
      void this.talkLocked();
      return;
    }
    if (tr && this.canWarp) {
      this.canWarp = false;
      this.switchMap(tr.map, tr.spawn);
      return;
    }
    if (this.warp && i === this.warp.tile) {
      void this.enterWarp();
      return;
    }
    if (this.checkTrigger(i)) return;
    this.checkRandomEncounter();
  }

  private checkTrigger(i: number): boolean {
    const tr = this.triggers.get(i);
    if (!tr) {
      this.insideTrigger = null;
      return false;
    }
    if (tr.id === this.insideTrigger) return false;
    this.insideTrigger = tr.id;
    if (!tr.auto()) return false;
    void tr.run();
    return true;
  }

  private interact(): void {
    if (this.busy || this.inBattle || this.moving || this.time.now < this.inputLockUntil) return;
    const [x, y] = this.playerTile();
    const front = this.idx(x + DELTA[this.facing][0], y + DELTA[this.facing][1]);
    if (this.midBoss && front === this.midBoss.tile) {
      void this.confrontMidBoss();
      return;
    }
    if (this.areaBoss && front === this.areaBoss.tile) {
      void this.confrontAreaBoss();
      return;
    }
    if (this.lastBoss && front === this.lastBoss.tile) {
      void this.confrontLastBoss();
      return;
    }
    const around = [front, this.idx(x, y)];
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) around.push(this.idx(x + dx, y + dy));
    for (const i of around) {
      const npc = this.npcs.get(i);
      if (npc) {
        void this.talkNpc(npc);
        return;
      }
      const chest = this.chests.get(i);
      if (chest) {
        void this.openChest(chest);
        return;
      }
      const sign = this.signs.get(i);
      if (sign) {
        void sign();
        return;
      }
    }
  }

  /**
   * フィールド・離島の 見た目（ドラクエのような すっきりした 地図）：background の 上に 見た目だけの レイヤーを しく。
   * 海の 波・ひとかたまりの 森・山なみ・つなぎめの ない 草原や 田んぼ（overworld/overworldView.ts・viewTiles.ts）
   */
  /** 入口の しるし：フィールドでは 行き先の 絵（町・どうくつ・お城・港）、町・ダンジョンの 中の 出口は 光る 床 */
  private gateIcon(target: string): string {
    if (this.kind() !== 'field' && this.kind() !== 'enclave') return 'fld.gate';
    if (target.endsWith('-town')) return 'fld.icon.town';
    if (target.endsWith('-dungeon')) return 'fld.icon.cave';
    if (target.endsWith('-secret')) return 'fld.icon.castle';
    return 'fld.icon.port';
  }

  private addViewLayer(): void {
    buildViewTexture(this);
    buildEntranceIcons(this);
    const bg = this.map.getLayer('background');
    if (!bg) return;
    const w = this.map.width;
    const h = this.map.height;
    // Tiled の 地図には あとから タイルセットを 足せないので、見た目だけの タイルマップを 別に つくって 上に しく
    const vmap = this.make.tilemap({ tileWidth: TILE, tileHeight: TILE, width: w, height: h });
    const tiles = vmap.addTilesetImage('overworld-view', 'overworld-view', TILE, TILE, 0, 0, 0);
    const layer = tiles ? vmap.createBlankLayer('view', tiles, 0, 0) : null;
    if (!layer) return;
    const ids = overworldView(
      bg.data.flatMap((row) => row.map((t) => t.index)),
      w,
      h,
    );
    const rows: number[][] = [];
    for (let y = 0; y < h; y++) rows.push(ids.slice(y * w, (y + 1) * w));
    layer.putTilesAt(rows, 0, 0);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => vmap.destroy());
  }

  // ───────────────────────── マップの物体 ─────────────────────────

  private setupObjects(layer: Phaser.Tilemaps.ObjectLayer | null): void {
    const area = this.currentArea();
    for (const obj of layer?.objects ?? []) {
      const tx = Math.floor((obj.x ?? 0) / TILE);
      const ty = Math.floor((obj.y ?? 0) / TILE);
      switch (obj.type) {
        case 'transition':
          this.addTransition(obj, tx, ty);
          break;
        case 'npc':
          this.addNpc(obj, tx, ty, area);
          break;
        case 'chest':
          this.addChest(obj, tx, ty);
          break;
        case 'midboss':
          this.addMidBoss(tx, ty, area);
          break;
        case 'boss':
          this.addAreaBoss(tx, ty, area);
          break;
        case 'lastboss':
          this.addLastBoss(tx, ty, area);
          break;
        case 'event':
          this.addEvent(obj, tx, ty, area);
          break;
        case 'landmark':
          this.addLandmark(obj, tx, ty, area);
          break;
        case 'specialty':
          this.addSpecialty(obj, tx, ty, area);
          break;
      }
    }
  }

  private addTransition(obj: TiledObject, tx: number, ty: number): void {
    const target = prop(obj, 'targetMap');
    if (typeof target !== 'string') return;
    const spawn = String(prop(obj, 'targetSpawn') ?? 'spawn');
    // 県 ⇄ 離島 は ふむと ワープ ではなく、港の せんどうさんに たのんで 船で わたる
    if (this.isHarborGate(target)) {
      this.addHarbor(tx, ty, target, spawn);
      return;
    }
    const lock = prop(obj, 'lock');
    const w = Math.max(1, Math.round((obj.width ?? TILE) / TILE));
    for (let k = 0; k < w; k++) {
      const i = this.idx(tx + k, ty);
      this.transitions.set(i, { map: target, spawn });
      if (typeof lock === 'string') this.lockedGates.set(i, lock);
      const icon = this.gateIcon(target);
      const pad = this.add.image((tx + k) * TILE + 8, ty * TILE + 8, icon).setDepth(ty * TILE);
      // まだ ひらかない 入口（裏ステージ）は くらく、光らせない
      if (this.isLocked(i)) {
        pad.setTint(0x555566);
        continue;
      }
      // フィールドの 入口は 町・どうくつ・お城・港の 絵（光らせない）。町・ダンジョンの 出口だけ 光る 床
      if (icon !== 'fld.gate') continue;
      this.tweens.add({
        targets: pad,
        alpha: 0.55,
        yoyo: true,
        repeat: -1,
        duration: 700,
        ease: 'Stepped',
        easeParams: [3],
      });
    }
  }

  /** 県の フィールド → 離島、離島 → 県の フィールド の 入口か（離島の 中の 船は ちがう） */
  private isHarborGate(target: string): boolean {
    const k = this.kind();
    if (k === 'field') return ENCLAVES.some((e) => e.enclaveId === target);
    if (k === 'enclave') return target.endsWith('-field');
    return false;
  }

  /**
   * 離島への 港（ハーバー）：もとの 入口の マスに せんどうさんが 立ち、海の 方へ さんばしが のびて、先に 船が うかぶ。
   * せんどうさんに 話すと「〇〇ゆきの ふねが でるよ。のっていくかい？」→ はい で 島へ（ferryTalk）
   */
  private addHarbor(tx: number, ty: number, target: string, spawn: string): void {
    const back = this.kind() === 'enclave';
    const enclave = ENCLAVES.find((e) => e.enclaveId === (back ? this.mapKey : target));
    const place = back
      ? (this.content()?.areas.get(enclave?.prefId ?? '')?.name ?? target)
      : (enclave?.name ?? target);
    // 海の 向き：となりから 水の マスが いちばん 長く つづく 向き
    const bg = this.map.getLayer('background');
    const water = (x: number, y: number) => this.inside(x, y) && bg?.data[y]?.[x]?.index === WATER_TILE;
    let sea: Dir = 'down';
    let run = -1;
    for (const d of DIRS) {
      let n = 0;
      while (n < 4 && water(tx + DELTA[d][0] * (n + 1), ty + DELTA[d][1] * (n + 1))) n++;
      if (n > run) {
        run = n;
        sea = d;
      }
    }
    const [dx, dy] = DELTA[sea];
    if (run > 0) {
      // さんばし（水の 上に 2 マスまで）と、その先の 船（ゆらゆら）
      const len = Math.min(2, run - 1);
      for (let k = 1; k <= len; k++)
        this.add
          .image((tx + dx * k) * TILE + 8, (ty + dy * k) * TILE + 8, dx ? 'fld.pier.h' : 'fld.pier.v')
          .setDepth(2);
      const sx = (tx + dx * (len + 1)) * TILE + 8;
      const sy = (ty + dy * (len + 1)) * TILE + 8;
      const ship = this.add
        .image(sx, sy, 'fld.ship')
        .setFlipX(dx > 0)
        .setDepth(sy + 12);
      this.tweens.add({
        targets: ship,
        y: sy - 1,
        yoyo: true,
        repeat: -1,
        duration: 900,
        ease: 'Stepped',
        easeParams: [2],
      });
    }
    // せんどうさん（陸の 方を 向く）
    const tex = 'char.npc.ferry';
    addSheet(this.textures, tex, walkSheet(NPC_LOOKS.ferry!), CHAR_W, CHAR_H);
    const x = tx * TILE + 8;
    const y = ty * TILE + 8;
    this.add
      .image(x, y + 6, 'fld.shadow')
      .setAlpha(0.3)
      .setDepth(1);
    const land: Dir = sea === 'up' ? 'down' : sea === 'down' ? 'up' : sea === 'left' ? 'right' : 'left';
    const sprite = this.add.sprite(x, y, tex, walkFrame(land, 1)).setOrigin(0.5, FEET_ORIGIN_Y).setDepth(y);
    const i = this.idx(tx, ty);
    this.blocked.add(i);
    this.npcs.set(i, {
      key: `ferry_${target}`,
      role: 'ferry',
      name: t('field.roleFerry'),
      lines: [],
      sprite,
      ferry: { map: target, spawn, place, back },
    });
  }

  /** せんどうさん：「〇〇ゆきの ふねが でるよ。のっていくかい？」→ はい で 船に のって わたる。わたったら true */
  private async ferryTalk(npc: Npc): Promise<boolean> {
    const f = npc.ferry;
    if (!f) return false;
    const go = await this.choose(
      [{ speaker: npc.name, text: t(f.back ? 'field.ferryAskBack' : 'field.ferryAsk', { place: f.place }) }],
      [t('ui.yes'), t('ui.no')],
    );
    if (go !== 0) {
      await this.talk([{ speaker: npc.name, text: t('field.ferryLater') }]);
      return false;
    }
    await this.talk([{ speaker: npc.name, text: t('field.ferryGo') }]);
    playSfx('select');
    this.switchMap(f.map, f.spawn);
    return true;
  }

  private addNpc(obj: TiledObject, tx: number, ty: number, area: Area | undefined): void {
    const role = String(prop(obj, 'role') ?? obj.name.replace(/^npc_/, ''));
    const npcs = area?.town?.npcs ?? [];
    // 町の人（talk）は 名前で、お店の人は 役わりでも さがす
    const info =
      npcs.find((n) => n.id === obj.name) ??
      (role === 'talk' ? undefined : npcs.find((n) => n.role === role));
    const r = info?.role ?? role;
    const tex = `char.npc.${NPC_LOOKS[r] ? r : 'talk'}`;
    addSheet(this.textures, tex, walkSheet(NPC_LOOKS[r] ?? NPC_LOOKS.talk!), CHAR_W, CHAR_H);
    const x = tx * TILE + 8;
    const y = ty * TILE + 8;
    this.add
      .image(x, y + 6, 'fld.shadow')
      .setAlpha(0.3)
      .setDepth(1);
    const sprite = this.add.sprite(x, y, tex, walkFrame('down', 1)).setOrigin(0.5, FEET_ORIGIN_Y).setDepth(y);
    const i = this.idx(tx, ty);
    this.blocked.add(i);
    this.npcs.set(i, {
      key: obj.name,
      role: r,
      name:
        info?.name ??
        (r === 'talk' ? this.villagerJob(area, obj.name) : t(ROLE_NAME_KEYS[r] ?? 'field.npcDefault')),
      lines: info?.dialogue ?? this.villagerLines(area, obj.name),
      sprite,
    });
    // お店の かべの 看板（木の板に お店の アイコン）
    const sx = prop(obj, 'signX');
    const sy = prop(obj, 'signY');
    if (typeof sx === 'number' && typeof sy === 'number' && this.textures.exists(`ico.role-${r}`)) {
      const px = sx * TILE + 8;
      const py = sy * TILE + 8;
      this.add.image(px, py, 'fld.plate').setDepth(sy * TILE + 1);
      this.add.image(px, py + 1, `ico.role-${r}`).setDepth(sy * TILE + 2);
    }
  }

  /** content に せりふの無い 町の人：この県の 名所・特産品を ひとつ 教えてくれる（どれかは 名前の番号で決まる） */
  private villagerLines(area: Area | undefined, name: string): DialogueLine[] {
    const motif = villagerMotif(area, name);
    if (!motif) return [{ text: t('field.villagerHello', { town: area?.town?.name ?? area?.name ?? '' }) }];
    return [{ text: t('field.villagerTip', { name: motif.name }) }, { text: motif.blurb }];
  }

  /** 町の人の しごと（はなす 名所・特産品の しゅるいで きまる）。名前の かわりに よぶ */
  private villagerJob(area: Area | undefined, name: string): string {
    const kind = villagerMotif(area, name)?.kind;
    return t(kind ? JOB_NAME_KEYS[kind] : 'field.npcDefault');
  }

  private addChest(obj: TiledObject, tx: number, ty: number): void {
    const key = `${this.mapKey}:${obj.name}`;
    const opened = this.gs()?.progress.chestsOpened.includes(key) ?? false;
    const x = tx * TILE + 8;
    const y = ty * TILE + 8;
    const sprite = this.add.image(x, y, opened ? 'fld.chest.open' : 'fld.chest').setDepth(y);
    const i = this.idx(tx, ty);
    this.blocked.add(i);
    const itemId = String(prop(obj, 'itemId') ?? '');
    this.chests.set(i, {
      key,
      itemId,
      // 名前は content のアイテム（無ければ マップに書いた名前）
      itemName: this.content()?.items.get(itemId)?.name ?? String(prop(obj, 'itemName') ?? t('field.chest')),
      count: typeof prop(obj, 'count') === 'number' ? (prop(obj, 'count') as number) : 1,
      sprite,
    });
  }

  /**
   * 特産品の宝箱：あけると 特産品の説明が出て、その特産品（アイテム `<県>-<motif の id>`）が もらえる。
   * あけた特産品は 名所と同じく 図鑑（dex.motifs）にのり、にほんちずの数にも入る
   */
  private addSpecialty(obj: TiledObject, tx: number, ty: number, area: Area | undefined): void {
    const motif = area?.motifs.find((m) => m.id === prop(obj, 'motifId'));
    if (!area || !motif) return;
    const stamp = motifStamp(area.id, motif.id);
    const opened = this.gs()?.dex.motifs.includes(stamp) ?? false;
    const x = tx * TILE + 8;
    const y = ty * TILE + 8;
    const sprite = this.add.image(x, y, opened ? 'fld.chest.open' : 'fld.chest').setDepth(y);
    const i = this.idx(tx, ty);
    this.blocked.add(i);
    const itemId = `${area.id}-${motif.id}`;
    this.chests.set(i, {
      key: `${this.mapKey}:${obj.name}`,
      itemId,
      itemName: this.content()?.items.get(itemId)?.name ?? motif.name,
      count: 1,
      sprite,
      specialty: { area, motif, stamp },
    });
    this.stampIds.push(stamp);
  }

  /**
   * 中ボス：フィールドでは 1 マスの「？」マーク（だれがいるかは戦うまでわからない。地図でも「？」）。
   * 小物に見えないよう、まわりに光のわっか・足もとの光る輪・立ちのぼる光のつぶ（オーラ）。
   * ぶつかると「たたかう？」。ボスの姿はバトルで はじめて見える（バトルでは一回り大きく出す）
   */
  private addMidBoss(tx: number, ty: number, area: Area | undefined): void {
    const def = area?.midBoss ? this.content()?.monsters.get(area.midBoss) : undefined;
    if (!area || !def) return;
    if (this.gs()?.progress.eventsDone.includes(midBossFlag(area.id))) {
      this.openWarp(tx, ty, area, false);
      return;
    }
    this.midBoss = this.bossMarker(tx, ty, def);
  }

  /** 県ボス：ダンジョンの おくの へや（さいだんの 前）に 立つ。見た目と ぶつかったときは 中ボスと同じ。倒すと 県のしるし */
  private addAreaBoss(tx: number, ty: number, area: Area | undefined): void {
    const def = area?.boss ? this.content()?.monsters.get(area.boss) : undefined;
    if (!area || !def || this.gs()?.progress.eventsDone.includes(areaBossFlag(area.id))) return;
    this.areaBoss = this.bossMarker(tx, ty, def);
  }

  /** ボスの「？」マーク（光のわっか・足もとの光る輪・立ちのぼる光のつぶ）を出して、そのマスを 通れなくする */
  private bossMarker(tx: number, ty: number, def: Monster): MidBoss {
    const x = tx * TILE + 8;
    const y = ty * TILE + 8;
    const aura = this.add.image(x, y + 5, 'fld.boss.aura').setDepth(2);
    this.tweens.add({
      targets: aura,
      alpha: 0.35,
      yoyo: true,
      repeat: -1,
      duration: 500,
      ease: 'Stepped',
      easeParams: [2],
    });
    const glow = this.add
      .image(x, y - 1, 'fld.boss.glow')
      .setAlpha(0.45)
      .setDepth(y - 2);
    this.tweens.add({
      targets: glow,
      alpha: 0.2,
      yoyo: true,
      repeat: -1,
      duration: 450,
      ease: 'Stepped',
      easeParams: [3],
    });
    const halo = this.add.image(x, y - 1, 'fld.boss.halo').setDepth(y - 1);
    const mark = this.add.image(x, y - 1, 'fld.boss.q').setDepth(y);
    this.tweens.add({
      targets: [mark, halo, glow],
      y: y - 3,
      yoyo: true,
      repeat: -1,
      duration: 500,
      ease: 'Stepped',
      easeParams: [2],
    });
    this.tweens.add({
      targets: halo,
      alpha: 0.4,
      yoyo: true,
      repeat: -1,
      duration: 350,
      ease: 'Stepped',
      easeParams: [2],
    });
    // 光のつぶが、ときどき足もとから立ちのぼって消える
    const sparks = this.time.addEvent({
      delay: 260,
      loop: true,
      callback: () => {
        const s = this.add
          .image(x + this.rng.int(-9, 9), y + this.rng.int(-2, 5), 'fld.boss.spark')
          .setDepth(y + 1);
        this.tweens.add({
          targets: s,
          y: s.y - 16,
          alpha: 0,
          duration: 700,
          ease: 'Stepped',
          easeParams: [7],
          onComplete: () => s.destroy(),
        });
      },
    });
    const i = this.idx(tx, ty);
    this.blocked.add(i);
    return { tile: i, def, parts: [aura, glow, halo, mark], sparks };
  }

  /** 中ボスがいた場所に、次の県（島の最後の県なら次の島の最初の県）へのワープホールを開く */
  private openWarp(tx: number, ty: number, area: Area, appear: boolean): void {
    const content = this.content();
    const to = content
      ? nextStop(content.world, area.id, (id) => content.areas.get(id)?.mapKeys?.field ?? `${id}-field`)
      : null;
    if (!content || !to) return;
    const toName = content.areas.get(to.id)?.name ?? to.id;
    const x = tx * TILE + 8;
    const y = ty * TILE + 8;
    if (!this.anims.exists('fld.warp.spin'))
      this.anims.create({
        key: 'fld.warp.spin',
        frames: Array.from({ length: WARP_FRAMES }, (_, f) => ({ key: 'fld.warp', frame: f })),
        frameRate: 8,
        repeat: -1,
      });
    const hole = this.add.sprite(x, y, 'fld.warp', 0).setDepth(y - 8);
    hole.play('fld.warp.spin');
    if (appear) {
      hole.setScale(0);
      this.tweens.add({ targets: hole, scale: 1, duration: 600, ease: 'Stepped', easeParams: [6] });
    }
    this.warp = { tile: this.idx(tx, ty), to, toName };
  }

  private addEvent(obj: TiledObject, tx: number, ty: number, area: Area | undefined): void {
    const ev = area?.events.find((e) => e.trigger.map === this.mapKey && e.trigger.objectName === obj.name);
    if (!area || !ev) return;
    const motif = area.motifs.find((m) => m.id === ev.motifId);
    const challenged = () => this.gs()?.progress.eventsDone.includes(ev.id) ?? false;
    const done = () => ev.once && challenged();
    const sign = this.addSign(tx, ty, motifStamp(area.id, ev.motifId), challenged);
    const run = () => this.runEvent(area, ev, motif, sign);
    this.addTrigger(tx, ty, { id: ev.id, auto: () => !done(), run });
    this.signs.set(this.idx(tx, ty), run);
    if (this.kind() === 'field') this.stampIds.push(sign.stamp);
  }

  private addLandmark(obj: TiledObject, tx: number, ty: number, area: Area | undefined): void {
    const motif = area?.motifs.find((m) => m.id === prop(obj, 'motifId'));
    if (!area || !motif) return;
    // チャレンジの無い名所は、見つけたら終わり（すぐ金色）
    const sign = this.addSign(tx, ty, motifStamp(area.id, motif.id), () => true);
    const run = () => this.visitLandmark(area, motif, sign);
    this.addTrigger(tx, ty, { id: `lm.${motif.id}`, auto: () => !sign.found(), run });
    this.signs.set(this.idx(tx, ty), run);
    this.stampIds.push(sign.stamp);
  }

  /**
   * 名所の ★ 看板（GDD §7）。名前の札は出さず、★ の色で進みぐあいを見せる：
   *  灰色 = まだ見つけていない / 白＋上に「！」 = 見つけたが チャレンジが まだ / 金色 = ぜんぶ終わった
   */
  private addSign(tx: number, ty: number, stamp: string, challenged: () => boolean): Sign {
    const x = tx * TILE + 8;
    const y = ty * TILE + 8;
    const found = () => this.gs()?.dex.motifs.includes(stamp) ?? false;
    const texture = () => (!found() ? 'fld.sign' : challenged() ? 'fld.sign.done' : 'fld.sign.todo');
    const img = this.add.image(x, y, texture()).setDepth(y);
    let mark: Phaser.GameObjects.Image | null = null;
    const syncMark = () => {
      const todo = found() && !challenged();
      if (todo && !mark) {
        mark = this.add
          .image(x, y - 8, 'fld.sign.mark')
          .setOrigin(0.5, 1)
          .setDepth(y + 1);
        this.tweens.add({
          targets: mark,
          y: y - 11,
          yoyo: true,
          repeat: -1,
          duration: 400,
          ease: 'Stepped',
          easeParams: [1],
        });
      } else if (!todo && mark) {
        mark.destroy();
        mark = null;
      }
    };
    syncMark();
    return {
      stamp,
      found,
      refresh: () => {
        const next = texture();
        syncMark();
        if (img.texture.key === next) return;
        img.setTexture(next);
        this.tweens.add({
          targets: img,
          y: y - 3,
          yoyo: true,
          duration: 120,
          ease: 'Stepped',
          easeParams: [3],
        });
      },
    };
  }

  /** 名所を見つけた：スタンプを押し、看板の ★ を白（チャレンジがまだ）か金色に。はじめて見つけたときだけ true */
  private discover(sign: Sign): boolean {
    const gs = this.gs();
    if (!gs || sign.found()) return false;
    this.setGame(markDone(gs, { stamp: sign.stamp }));
    playSfx('stamp');
    sign.refresh();
    this.renderHud();
    return true;
  }

  private addTrigger(tx: number, ty: number, tr: FieldTrigger): void {
    for (let dy = -TRIGGER_RADIUS; dy <= TRIGGER_RADIUS; dy++)
      for (let dx = -TRIGGER_RADIUS; dx <= TRIGGER_RADIUS; dx++) {
        if (!this.inside(tx + dx, ty + dy)) continue;
        const i = this.idx(tx + dx, ty + dy);
        if (!this.triggers.has(i)) this.triggers.set(i, tr);
      }
  }

  // ───────────────────────── 名所イベント ─────────────────────────

  /** 名所に着いた：はじめてなら、カットインを出して見つけたことにする。スタンプの一言を返す（見つけ済みなら空） */
  private async arriveAt(area: Area, motif: Motif | undefined, sign: Sign): Promise<DialogueLine[]> {
    if (sign.found()) return [];
    playSfx('discover');
    await this.cutin(area.id, motif);
    return this.discover(sign) ? [{ text: t('field.stampGet', this.stampCount()) }] : [];
  }

  /** 名所スタンプ：（はじめてなら カットイン → ★ が黄色に）→ 名所の説明 → スタンプ */
  private async visitLandmark(area: Area, motif: Motif, sign: Sign): Promise<void> {
    if (this.busy) return;
    this.busy = true;
    this.standStill();
    const stampLine = await this.arriveAt(area, motif, sign);
    await this.talk([
      { speaker: t('field.landmarkSpeaker'), text: motif.blurb },
      ...(stampLine.length ? stampLine : [{ text: t('field.stampHave') }]),
    ]);
    await this.checkMeisan();
    this.busy = false;
  }

  /** イベント：（はじめてなら カットイン → ★ が黄色に → スタンプ）→ 会話 → ちょうせんする？ → 問題 → ごほうび → お礼 */
  private async runEvent(area: Area, ev: AreaEvent, motif: Motif | undefined, sign: Sign): Promise<void> {
    if (this.busy) return;
    this.busy = true;
    this.standStill();
    const stampLine = await this.arriveAt(area, motif, sign);
    if (ev.once && this.gs()?.progress.eventsDone.includes(ev.id)) {
      await this.talk([
        { speaker: t('field.landmarkSpeaker'), text: motif?.blurb ?? '' },
        ...(stampLine.length ? stampLine : [{ text: t('field.stampHave') }]),
      ]);
      await this.checkMeisan();
      this.busy = false;
      return;
    }
    const host = ev.dialogue[ev.dialogue.length - 1]?.speaker;
    const go = await this.choose(
      [...stampLine, ...ev.dialogue, { speaker: host, text: t('field.eventAsk') }],
      [t('ui.yes'), t('ui.no')],
    );
    if (go !== 0) {
      await this.talk([{ speaker: host, text: t('field.eventLater') }]);
      await this.checkMeisan();
      this.busy = false;
      return;
    }
    const score = await this.quiz(ev, motif);
    const gs = this.gs();
    if (!gs) {
      this.busy = false;
      return;
    }
    const applied = applyReward(gs, pickReward(ev.rewardByScore, score));
    // once でないイベントも「チャレンジした」ことは残す（★ を金色にする。何度でも遊べるのは同じ）
    this.setGame(markDone(applied.state, { eventId: ev.id, stamp: sign.stamp }));
    sign.refresh();
    playSfx('recruit');
    const out: DialogueLine[] = applied.lines.map((l) => ({
      speaker: t('field.rewardSpeaker'),
      text: this.rewardText(l),
    }));
    out.push(...(ev.afterDialogue ?? []));
    this.renderHud();
    await this.talk(out);
    await this.checkMeisan();
    this.busy = false;
  }

  private rewardText(l: RewardLine): string {
    const c = this.content();
    switch (l.kind) {
      case 'xp':
        return t('field.rewardXp', { n: l.n });
      case 'gold':
        return t('field.rewardGold', { n: l.n });
      case 'item':
        return t('field.rewardItem', { item: c?.items.get(l.id)?.name ?? l.id, n: l.n });
      case 'skill':
        return t('field.rewardSkill', { skill: c?.skills.get(l.id)?.name ?? l.id });
      case 'recipe': {
        const r = c?.recipes.get(l.id);
        return t('field.rewardRecipe', { item: (r && c?.items.get(r.result.itemId)?.name) ?? l.id });
      }
      case 'title':
        return t('field.rewardTitle', { title: l.id });
      case 'monster':
        return t('field.rewardMonster');
    }
  }

  /** 名所の問題。出せる問題が無いときは 0 点あつかい（ごほうびは必ずもらえる：GDD §7） */
  private async quiz(ev: AreaEvent, motif: Motif | undefined): Promise<number> {
    const content = this.content();
    const bank = this.registry.get('bank') as QuestionBank | undefined;
    const gs = this.gs();
    if (!content || !bank || !gs) return 0;
    const host = document.createElement('div');
    host.className = 'nq-bq-slot';
    const root = this.root('fx');
    render(
      h(QuestionFrame, {
        host,
        title: motif?.name ?? '',
        subject: ev.question.subject,
        hint: t('field.questionHint'),
      }),
      root,
    );
    const env = buildAskEnv({
      host,
      gs,
      content,
      bank,
      mastery: new MasteryStore(gs.learning.mastery),
      rng: this.rng,
      speak: this.speak,
    });
    let score: number | null = null;
    try {
      score = await askFirst(env, relaxedQueries(ev.question));
    } finally {
      render(null, root);
    }
    if (score === null) {
      await this.talk([{ text: t('field.noQuestion') }]);
      return 0;
    }
    return score;
  }

  /** image を わたすと その絵（特産品は どうぐの アイコン）。無ければ 名所の絵 assets/motifs/<県>/<id>.png */
  private cutin(
    areaId: string,
    motif: Motif | undefined,
    title = t('field.landmarkFound'),
    image?: string,
  ): Promise<void> {
    if (!motif) return Promise.resolve();
    const base = import.meta.env.BASE_URL.replace(/\/$/, '');
    // 絵の じゅん：わたされた 絵 → 特産品の どうぐの アイコン（<県>-<motif>）→ 名所の えはがき（motifArt）→ 本番の 絵（assets）。
    // ※ 以前は 絵が読めないと 種類のアイコン（たべもの＝おにぎり、名所＝どれも同じ 建物）になり、意味が わからなかった
    const item = this.content()?.items.get(`${areaId}-${motif.id}`);
    return this.show('fx', (done) =>
      h(LandmarkCutin, {
        title,
        name: motif.name,
        kind: motif.kind,
        kindLabel: t(MOTIF_KIND_KEY[motif.kind]),
        image:
          image ??
          (item ? itemIconUrl(item) : undefined) ??
          motifArtUrl(areaId, motif) ??
          `${base}/assets/motifs/${areaId}/${motif.id}.png`,
        onDone: done,
      }),
    );
  }

  /** 名所スタンプの数。県のフィールドと離島の ★ 看板ぜんぶ（にほんちずと同じ数え方。地図データが無ければ このマップだけ） */
  private stampCount(): { n: number; total: number } {
    const have = this.gs()?.dex.motifs ?? [];
    const area = this.currentArea();
    const data = this.cache.json.get(WORLD_MAP_KEY) as WorldMapData | undefined;
    const entry = area ? data?.regions.flatMap((r) => r.areas).find((a) => a.id === area.id) : undefined;
    const all = area && entry ? entry.stamps.map((m) => motifStamp(area.id, m)) : this.stampIds;
    return { n: all.filter((s) => have.includes(s)).length, total: all.length };
  }

  /** その県の 名所スタンプ（★）の motif id ぜんぶ（にほんちずと 同じ） */
  private stampsOf(areaId: string): readonly string[] {
    const data = this.cache.json.get(WORLD_MAP_KEY) as WorldMapData | undefined;
    return data?.regions.flatMap((r) => r.areas).find((a) => a.id === areaId)?.stamps ?? [];
  }

  /** 県の ★ が ぜんぶ そろったら めいさんひんの そうびを わたす（カットイン → ひとこと） */
  private async checkMeisan(): Promise<void> {
    const c = this.content();
    const gs = this.gs();
    if (!c || !gs) return;
    for (const it of meisanEarned(gs, c.items.values(), (id) => this.stampsOf(id))) {
      this.setGame(giveMeisan(this.gs()!, it));
      playSfx('discover');
      await this.itemCutin(it, it.name, t('field.meisanFound'));
      const area = it.areaOrigin ? c.areas.get(it.areaOrigin)?.name : undefined;
      await this.talk([
        { text: t('field.meisanGet', { area: area ?? '', item: it.name }) },
        { text: t('field.meisanHowTo') },
      ]);
    }
  }

  // ───────────────────────── 中ボスとワープホール ─────────────────────────

  private async confrontMidBoss(): Promise<void> {
    const mb = this.midBoss;
    if (!mb || this.busy || this.inBattle || !(await this.askBossBattle(mb.def))) return;
    this.pendingMidBoss = true;
    this.startBattle({ enemyId: mb.def.id, level: this.heroLevel(), zone: 'field', isBoss: true });
  }

  private async confrontAreaBoss(): Promise<void> {
    const ab = this.areaBoss;
    if (!ab || this.busy || this.inBattle || !(await this.askBossBattle(ab.def))) return;
    this.pendingAreaBoss = true;
    this.startBattle({ enemyId: ab.def.id, level: this.heroLevel(), zone: 'dungeon', isBoss: true });
  }

  /**
   * だれがいるかは戦うまでわからない：名前は「？？？」、文はボス本人のセリフ（fieldLine。無ければ共通のセリフ）。
   * 「たたかう？」で はい なら true
   */
  private async askBossBattle(def: Monster): Promise<boolean> {
    this.busy = true;
    this.standStill();
    const choice = await this.choose(
      [
        { speaker: t('field.bossSpeaker'), text: def.fieldLine ?? t('field.bossBlock') },
        { text: t('field.bossAsk') },
      ],
      [t('ui.yes'), t('ui.no')],
    );
    if (choice !== 0) await this.talk([{ text: t('field.bossLater') }]);
    this.busy = false;
    return choice === 0;
  }

  /** 倒したボスの「？」マークを 消して、そのマスを 通れるように する */
  private dismissBoss(b: MidBoss): void {
    this.blocked.delete(b.tile);
    b.sparks.remove();
    for (const part of b.parts)
      this.tweens.add({
        targets: part,
        alpha: 0,
        duration: 600,
        ease: 'Stepped',
        easeParams: [6],
        onComplete: () => part.destroy(),
      });
  }

  private async midBossDefeated(): Promise<void> {
    const mb = this.midBoss;
    const area = this.currentArea();
    const gs = this.gs();
    if (!mb || !area || !gs) return;
    this.busy = true;
    this.setGame(markDone(gs, { flag: midBossFlag(area.id) }));
    this.midBoss = null;
    this.dismissBoss(mb);
    await this.wait(650);
    playSfx('warp');
    this.openWarp(mb.tile % this.map.width, Math.floor(mb.tile / this.map.width), area, true);
    await this.wait(700);
    await this.talk([{ text: t('field.warpAppear', { name: this.warp?.toName ?? '' }) }]);
    this.busy = false;
  }

  /** 県ボスを倒した：県のしるし（progress.areaSigns）を もらう。「？」は 消えて、さいだんの 前が 通れるように なる */
  private async areaBossDefeated(): Promise<void> {
    const ab = this.areaBoss;
    const area = this.currentArea();
    const gs = this.gs();
    if (!ab || !area || !gs) return;
    this.busy = true;
    this.setGame(earnAreaSign(gs, area.id));
    this.areaBoss = null;
    this.dismissBoss(ab);
    await this.wait(650);
    playSfx('victory');
    await this.talk([{ text: t('field.areaSign', { name: area.name }) }]);
    this.busy = false;
  }

  /** 裏ステージの ラスボス（歴史上の 人物）：いちばん おくの へやに 立つ。見た目は ほかの ボスと 同じ「？」マーク */
  private addLastBoss(tx: number, ty: number, area: Area | undefined): void {
    const def = area?.secret ? this.content()?.monsters.get(area.secret.boss) : undefined;
    if (!area || !def || this.gs()?.progress.eventsDone.includes(lastBossFlag(area.id))) return;
    this.lastBoss = this.bossMarker(tx, ty, def);
  }

  /** ラスボスは 名前を かくさない（その土地の 歴史上の 人物が 名のって しょうぶを いどむ） */
  private async confrontLastBoss(): Promise<void> {
    const lb = this.lastBoss;
    if (!lb || this.busy || this.inBattle) return;
    this.busy = true;
    this.standStill();
    const choice = await this.choose(
      [
        { speaker: lb.def.name, text: lb.def.fieldLine ?? t('field.bossBlock') },
        { text: t('field.bossAsk') },
      ],
      [t('ui.yes'), t('ui.no')],
    );
    if (choice !== 0) await this.talk([{ text: t('field.bossLater') }]);
    this.busy = false;
    if (choice !== 0) return;
    this.pendingLastBoss = true;
    this.startBattle({ enemyId: lb.def.id, level: this.heroLevel(), zone: 'dungeon', isBoss: true });
  }

  /** ラスボスに かった：しるし（progress.eventsDone）を のこして「？」を けす */
  private async lastBossDefeated(): Promise<void> {
    const lb = this.lastBoss;
    const area = this.currentArea();
    const gs = this.gs();
    if (!lb || !area || !gs) return;
    this.busy = true;
    this.setGame(markDone(gs, { flag: lastBossFlag(area.id) }));
    this.lastBoss = null;
    this.dismissBoss(lb);
    await this.wait(650);
    playSfx('victory');
    await this.talk([
      { text: t('field.lastBossDown', { name: lb.def.name, stage: area.secret?.name ?? area.name }) },
    ]);
    this.busy = false;
  }

  /** かぎの かかった 入口が まだ ひらいていないか（'areaSign'：この県の 県ボスを まだ 倒していない） */
  private isLocked(tile: number): boolean {
    const lock = this.lockedGates.get(tile);
    if (!lock) return false;
    const area = this.currentArea();
    return lock === 'areaSign' && !!area && !this.gs()?.progress.eventsDone.includes(areaBossFlag(area.id));
  }

  /** まだ ひらかない 入口に のった：「おもい とびらが しまっている…」 */
  private async talkLocked(): Promise<void> {
    if (this.busy) return;
    this.busy = true;
    this.standStill();
    playSfx('miss');
    await this.talk([{ text: t('field.secretLocked') }]);
    this.busy = false;
  }

  private async enterWarp(): Promise<void> {
    const w = this.warp;
    if (!w || this.busy) return;
    this.busy = true;
    this.standStill();
    playSfx('warp');
    await this.talk([{ text: t('field.warpGo', { name: w.toName }) }]);
    this.busy = true;
    // くるくる回りながら、うずに吸いこまれる
    const order: Dir[] = ['down', 'left', 'up', 'right'];
    this.time.addEvent({
      delay: 70,
      repeat: 10,
      callback: (() => {
        let k = 0;
        return () => this.face(order[++k % 4]!);
      })(),
    });
    this.cameras.main.flash(300, 255, 255, 255);
    await this.tweenP({
      targets: this.player,
      scaleX: 0.2,
      scaleY: 1.4,
      alpha: 0,
      duration: 800,
      ease: 'Quad.easeIn',
    });
    this.switchMap(w.to.mapKey, 'spawn');
  }

  // ───────────────────────── 町の人・宝箱 ─────────────────────────

  private async talkNpc(npc: Npc): Promise<void> {
    this.busy = true;
    const [px, py] = this.playerTile();
    const nx = Math.floor(npc.sprite.x / TILE);
    const ny = Math.floor(npc.sprite.y / TILE);
    const toward: Dir =
      Math.abs(px - nx) > Math.abs(py - ny) ? (px < nx ? 'left' : 'right') : py < ny ? 'up' : 'down';
    npc.sprite.setFrame(walkFrame(toward, 1));
    const lines = npc.lines.map((l) => ({ ...l, speaker: l.speaker ?? npc.name }));
    // しごとの ある人は、あいさつの あとに しごとを してくれる
    switch (npc.role) {
      case 'shop':
        await this.talk(lines);
        await this.openShop(npc.name);
        break;
      case 'smith':
        await this.talk(lines);
        await this.openSmith(npc.name);
        break;
      case 'board':
        await this.talk(lines);
        await this.openBoard(npc.name);
        break;
      case 'inn':
        await this.innTalk(npc.name, lines);
        break;
      case 'dex':
        await this.dexTalk(npc.name, lines);
        break;
      case 'arena':
        // しょうぶが はじまったら バトルへ（busy は arenaTalk が もどす）
        if (await this.arenaTalk(npc.name, lines)) return;
        break;
      case 'ferry':
        // 船に のったら マップが かわる（busy は switchMap が もつ）
        if (await this.ferryTalk(npc)) return;
        break;
      default:
        await this.talk(lines);
        await this.villagerGiftTalk(npc);
    }
    npc.sprite.setFrame(walkFrame('down', 1));
    this.busy = false;
  }

  /** 町の人（talk）：はじめて 話したときだけ、しごとに おうじた おみやげを くれる（カットイン → 説明 → もらった！） */
  private async villagerGiftTalk(npc: Npc): Promise<void> {
    const gs = this.gs();
    const c = this.content();
    if (!gs || !c) return;
    const key = giftKey(this.mapKey, npc.key);
    if (gs.progress.counters[key]) return;
    const reward = villagerGift(this.currentArea(), npc.key, c.items);
    const applied = applyReward(gs, reward);
    applied.state.progress.counters[key] = 1;
    await this.talk([{ speaker: npc.name, text: t('field.townGift') }]);
    const first = reward.items?.[0];
    const item = first && c.items.get(first.itemId);
    playSfx('discover');
    if (item) await this.itemCutin(item, item.name, t('field.giftFound'));
    this.setGame(applied.state);
    playSfx('select');
    const out: DialogueLine[] = [];
    if (item?.blurb) out.push({ speaker: npc.name, text: item.blurb });
    out.push(...applied.lines.map((l) => ({ speaker: t('field.rewardSpeaker'), text: this.rewardText(l) })));
    await this.talk(out);
  }

  /**
   * 町の人の しごとの画面（おみせ・かじや・けいじばん）を出して、とじるまで待つ。
   * act が 中身を かえたら（かった・つくった）同じ画面を 作りなおし、act の ひとことを 出す
   */
  private townMenu(
    make: () => Omit<TownOverlayProps, 'message' | 'focusKey' | 'onAct' | 'onClose'>,
    act: (key: string) => string | null,
  ): Promise<void> {
    return new Promise((resolve) => {
      const root = this.root('travel');
      const draw = (message: string | null, focusKey?: string) =>
        render(
          h(TownOverlay, {
            ...make(),
            message,
            focusKey,
            onAct: (k: string) => draw(act(k), k),
            onClose: () => {
              playSfx('back');
              render(null, root);
              this.inputLockUntil = this.time.now + 250;
              this.waitRelease = true;
              resolve();
            },
          }),
          root,
        );
      draw(null);
    });
  }

  /** おみせ：どうぐを かう */
  private async openShop(speaker: string): Promise<void> {
    const c = this.content();
    const area = this.currentArea();
    if (!c || !area) return;
    const stock = shopStock(area, c.items);
    await this.townMenu(
      () => {
        const gs = this.gs()!;
        const rows: TownRow[] = stock.flatMap((e) => {
          const it = c.items.get(e.itemId);
          if (!it) return [];
          const ok = gs.player.gold >= e.price;
          const lines = [t('field.townHave', { n: gs.inventory[it.id] ?? 0 })];
          if (!ok) lines.push(t('field.townPoor'));
          return [
            {
              key: it.id,
              name: it.name,
              icon: itemIconUrl(it),
              right: t('field.townPrice', { n: e.price }),
              dim: !ok,
              lines,
              blurb: it.blurb,
              action: { label: t('field.townBuy', { n: e.price }), ok },
            },
          ];
        });
        return {
          title: t('field.roleShop'),
          icon: 'role-shop',
          gold: gs.player.gold,
          rows,
          empty: t('field.townLater'),
          keys: t('field.townShopKeys'),
        };
      },
      (key) => {
        const gs = this.gs();
        const e = stock.find((s) => s.itemId === key);
        const next = gs && e && buyItem(gs, e);
        if (!next) {
          playSfx('miss');
          return t('field.townPoor');
        }
        this.setGame(next);
        playSfx('select');
        return t('field.townBought', { item: c.items.get(key)?.name ?? key });
      },
    );
    await this.talk([{ speaker, text: t('field.townShopBye') }]);
  }

  /** かじや：レシピと ざいりょうで そうびを つくる */
  private async openSmith(speaker: string): Promise<void> {
    const c = this.content();
    if (!c) return;
    await this.townMenu(
      () => {
        const gs = this.gs()!;
        const rows: TownRow[] = knownRecipes(c.recipes.values(), gs).flatMap((r) => {
          const it = c.items.get(r.result.itemId);
          if (!it) return [];
          const ok = canCraft(gs, r);
          const lines = [
            t('field.townNeed'),
            ...r.materials.map((m) =>
              t('field.townNeedLine', {
                item: c.items.get(m.itemId)?.name ?? m.itemId,
                have: gs.inventory[m.itemId] ?? 0,
                n: m.n,
              }),
            ),
          ];
          if (r.gold) lines.push(t('field.townCraftGold', { n: r.gold }));
          if (!ok) lines.push(t('field.townCantCraft'));
          return [
            {
              key: r.id,
              name: it.name,
              icon: itemIconUrl(it),
              tag: ok ? t('field.townCraft') : undefined,
              dim: !ok,
              lines,
              blurb: it.blurb,
              action: { label: t('field.townCraft'), ok },
            },
          ];
        });
        return {
          title: t('field.roleSmith'),
          icon: 'role-smith',
          gold: gs.player.gold,
          rows,
          empty: t('field.townSmithEmpty'),
          keys: t('field.townSmithKeys'),
        };
      },
      (key) => {
        const gs = this.gs();
        const r = c.recipes.get(key);
        const next = gs && r && craft(gs, r);
        if (!next || !r) {
          playSfx('miss');
          return t('field.townCantCraft');
        }
        this.setGame(next);
        playSfx('recruit');
        this.cameras.main.flash(200, 255, 255, 255);
        return t('field.townCrafted', { item: c.items.get(r.result.itemId)?.name ?? key });
      },
    );
    await this.talk([{ speaker, text: t('field.townLater') }]);
  }

  /** けいじばん：たのみごとを うける → たっせいしたら ほうこくして ごほうび */
  private async openBoard(speaker: string): Promise<void> {
    const c = this.content();
    const area = this.currentArea();
    if (!c || !area) return;
    const missions = missionsFor(area, c.monsters, c.items, {
      defeat: (name, n) => t('field.missionDefeat', { name, n }),
      collect: (item, n) => t('field.missionCollect', { item, n }),
    });
    const STATUS: Record<MissionStatus, string> = {
      new: 'field.missionNew',
      accepted: 'field.missionAccepted',
      ready: 'field.missionReady',
      done: 'field.missionDone',
    };
    const rewards: DialogueLine[] = [];
    await this.townMenu(
      () => {
        const gs = this.gs()!;
        const rows: TownRow[] = missions.map((m) => {
          const st = missionStatus(gs, m);
          const p = missionProgress(gs, m);
          const lines = [];
          if (m.hint) lines.push(m.hint);
          if (st === 'accepted' || st === 'ready')
            lines.push(t('field.townProgress', { n: p.have, need: p.need }));
          lines.push(t('field.townRewardLabel', { list: this.rewardSummary(m.reward) }));
          return {
            key: m.id,
            name: m.title,
            tag: st === 'ready' ? t(STATUS[st]) : undefined,
            sub: t(STATUS[st]),
            dim: st === 'done',
            lines,
            action:
              st === 'done'
                ? null
                : st === 'new'
                  ? { label: t('field.townAccept'), ok: true }
                  : { label: t('field.townReport'), ok: st === 'ready' },
          };
        });
        return {
          title: t('field.roleBoard'),
          icon: 'role-board',
          gold: gs.player.gold,
          rows,
          empty: t('field.townBoardEmpty'),
          keys: t('field.townBoardKeys'),
        };
      },
      (key) => {
        const gs = this.gs();
        const m = missions.find((x) => x.id === key);
        if (!gs || !m) return null;
        if (missionStatus(gs, m) === 'new') {
          this.setGame(acceptMission(gs, m));
          playSfx('select');
          return t('field.townAccepted', { title: m.title });
        }
        const done = completeMission(gs, m);
        if (!done) {
          playSfx('miss');
          return null;
        }
        this.setGame(done.state);
        playSfx('recruit');
        rewards.push(
          ...done.lines.map((l) => ({ speaker: t('field.rewardSpeaker'), text: this.rewardText(l) })),
        );
        return t('field.townThanks');
      },
    );
    this.renderHud();
    await this.talk([...rewards, { speaker, text: t('field.townLater') }]);
  }

  /** ごほうびを 1 行に（けいじばんの せつめい用）：50G・けいけんち 20・りんご×3 */
  private rewardSummary(r: Reward): string {
    const c = this.content();
    const parts: string[] = [];
    if (r.gold) parts.push(t('field.townRewardGold', { n: r.gold }));
    if (r.xp) parts.push(t('field.townRewardXp', { n: r.xp }));
    for (const it of r.items ?? [])
      parts.push(
        t('field.townRewardItem', { item: c?.items.get(it.itemId)?.name ?? it.itemId, n: it.n ?? 1 }),
      );
    for (const s of r.skills ?? []) parts.push(c?.skills.get(s)?.name ?? s);
    if (r.recipes?.length) parts.push(t('field.townRewardRecipe'));
    if (r.title) parts.push(t('field.townRewardTitle'));
    return parts.join('・');
  }

  /** やどや：とまると HP・MP が ぜんかい。負けたら ここに もどる */
  private async innTalk(speaker: string, lines: DialogueLine[]): Promise<void> {
    const gs = this.gs();
    const c = this.content();
    if (!gs || !c) return;
    const choice = await this.choose(
      [...lines, { speaker, text: t('field.townInnAsk', { price: INN_PRICE }) }],
      [t('field.townInnStay'), t('ui.cancel')],
    );
    if (choice !== 0) {
      await this.talk([{ speaker, text: t('field.townLater') }]);
      return;
    }
    const hero = partyFromGameState(gs, c).hero;
    const [x, y] = this.playerTile();
    const { state, paid } = innRest(
      gs,
      { hp: hero.stats.hp, mp: hero.stats.mp },
      { map: this.mapKey, x: x * TILE + 8, y: y * TILE + 8 },
    );
    if (!paid) await this.talk([{ speaker, text: t('field.townInnFree') }]);
    this.setGame(state);
    const cam = this.cameras.main;
    cam.fade(400, 0, 0, 0);
    await this.wait(900);
    playSfx('recruit');
    cam.fadeIn(400, 0, 0, 0);
    await this.wait(400);
    this.renderHud();
    await this.talk([
      { speaker, text: t('field.townInnRested') },
      { speaker, text: t('field.townInnSaved') },
    ]);
  }

  /** ずかんがかり：その県で 見つけた めいしょ・とくさんの数を おしえて、DEX_STEP こ ごとに ごほうび */
  private async dexTalk(speaker: string, lines: DialogueLine[]): Promise<void> {
    const gs = this.gs();
    const area = this.currentArea();
    if (!gs || !area) {
      await this.talk(lines);
      return;
    }
    const p = dexProgress(gs, area);
    const out: DialogueLine[] = [
      ...lines,
      { speaker, text: t('field.townDexCount', { area: area.name, n: p.found, total: p.total }) },
      { speaker, text: t('field.townDexMonsters', { n: gs.dex.monsters.length }) },
    ];
    const got = claimDexReward(gs, area);
    if (got) {
      this.setGame(got.state);
      playSfx('recruit');
      out.push(
        { speaker, text: t('field.townDexReward') },
        ...got.lines.map((l) => ({ speaker: t('field.rewardSpeaker'), text: this.rewardText(l) })),
      );
    }
    if (p.found >= p.total) out.push({ speaker, text: t('field.townDexAll') });
    else
      out.push({
        speaker,
        text: t('field.townDexNext', { n: Math.min(DEX_STEP - (p.found % DEX_STEP), p.total - p.found) }),
      });
    await this.talk(out);
  }

  /** たいせんじょう：この県の モンスターと しょうぶ（レベルは すこし上）。かったら しょうきん */
  private async arenaTalk(speaker: string, lines: DialogueLine[]): Promise<boolean> {
    const c = this.content();
    const area = this.currentArea();
    const choice = await this.choose(
      [...lines, { speaker, text: t('field.townArenaAsk', { n: ARENA_PRIZE }) }],
      [t('field.townArenaFight'), t('ui.cancel')],
    );
    const foes = [
      ...new Set(
        (area?.encounters ?? [])
          .flatMap((e) => e.table.map((x) => x.monsterId))
          .filter((id) => c?.monsters.has(id) && !c.monsters.get(id)!.isBoss),
      ),
    ];
    if (choice !== 0 || !foes.length) {
      await this.talk([{ speaker, text: t('field.townLater') }]);
      return false;
    }
    this.pendingArena = speaker;
    this.busy = false;
    this.startBattle({ enemyId: Phaser.Math.RND.pick(foes), level: this.heroLevel() + 2, zone: 'field' });
    return true;
  }

  private async arenaAfter(speaker: string, won: boolean): Promise<void> {
    this.busy = true;
    await this.wait(350);
    const gs = this.gs();
    if (won && gs) {
      const next = structuredClone(gs);
      next.player.gold += ARENA_PRIZE;
      next.arena.badges += 1;
      this.setGame(next);
      playSfx('recruit');
    }
    await this.talk([
      { speaker, text: won ? t('field.townArenaWin', { n: ARENA_PRIZE }) : t('field.townArenaLose') },
    ]);
    this.busy = false;
  }

  /** 宝箱：なにが出ても 特産品と同じように カットイン「たからもの ゲット！」→ どうぐの説明 → てに いれた！ */
  private async openChest(chest: Chest): Promise<void> {
    if (chest.specialty) return this.openSpecialty(chest, chest.specialty);
    const gs = this.gs();
    if (!gs) return;
    this.busy = true;
    this.standStill();
    const speaker = t('field.chest');
    if (gs.progress.chestsOpened.includes(chest.key)) {
      await this.talk([{ speaker, text: t('field.chestEmpty') }]);
      this.busy = false;
      return;
    }
    const item = this.chestItem(chest);
    const name = item?.name ?? chest.itemName;
    chest.sprite.setTexture('fld.chest.open');
    playSfx('discover');
    await this.itemCutin(item, name);
    const next = structuredClone(gs);
    next.progress.chestsOpened.push(chest.key);
    if (item) next.inventory[item.id] = (next.inventory[item.id] ?? 0) + chest.count;
    this.setGame(next);
    playSfx('select');
    // 説明（どうぐの blurb）を先に出してから、アイテムを わたす
    const lines: DialogueLine[] = [];
    if (item?.blurb) lines.push({ speaker, text: item.blurb });
    lines.push({ speaker, text: t('field.chestOpen', { item: name, n: chest.count }) });
    await this.talk(lines);
    this.busy = false;
  }

  /**
   * 宝箱の中身のどうぐ。マップの itemId が content に無いときは、
   * 名前（itemName）が同じどうぐにする（りんご → aomori-ringo）
   */
  private chestItem(chest: Chest): Item | undefined {
    const items = this.content()?.items;
    return (
      items?.get(chest.itemId) ??
      [...(items?.values() ?? [])].find((it) => kana(it.name) === kana(chest.itemName))
    );
  }

  /** 宝箱から出たものの カットイン（特産品と同じ見た目）。絵は その どうぐの アイコン（itemIcons）、無ければ宝箱のアイコン */
  private itemCutin(item: Item | undefined, name: string, title = t('field.treasureFound')): Promise<void> {
    const kind = item?.kind;
    const kindLabel = !kind
      ? t('field.itemKindTool')
      : kind === 'consumable'
        ? t('field.itemKindTool')
        : kind === 'material'
          ? t('field.itemKindMaterial')
          : kind === 'key'
            ? t('field.itemKindKey')
            : t('field.itemKindEquip', { slot: t(`slots.${kind}`) });
    return this.show('fx', (done) =>
      h(LandmarkCutin, {
        title,
        name,
        kind: kind ?? 'consumable',
        kindLabel,
        image: item ? itemIconUrl(item) : undefined,
        icon: 'chest',
        onDone: done,
      }),
    );
  }

  /** 特産品の宝箱：（はじめてなら カットイン）→ 特産品の説明 → アイテムを もらう → 図鑑にのる */
  private async openSpecialty(chest: Chest, sp: NonNullable<Chest['specialty']>): Promise<void> {
    const gs = this.gs();
    if (!gs) return;
    this.busy = true;
    this.standStill();
    const guide: DialogueLine = { speaker: t('field.specialtySpeaker'), text: sp.motif.blurb };
    const box = t('field.chest');
    if (gs.dex.motifs.includes(sp.stamp)) {
      await this.talk([guide, { speaker: box, text: t('field.chestEmpty') }]);
      this.busy = false;
      return;
    }
    playSfx('discover');
    // 特産品の カットインの絵は、その どうぐの アイコン
    const spItem = this.content()?.items.get(chest.itemId);
    await this.cutin(
      sp.area.id,
      sp.motif,
      t('field.specialtyFound'),
      spItem ? itemIconUrl(spItem) : undefined,
    );
    const item = this.content()?.items.get(chest.itemId);
    const next = markDone(gs, { stamp: sp.stamp });
    if (item) next.inventory[chest.itemId] = (next.inventory[chest.itemId] ?? 0) + chest.count;
    next.progress.chestsOpened.push(chest.key);
    this.setGame(next);
    playSfx('select');
    chest.sprite.setTexture('fld.chest.open');
    this.renderHud();
    // 説明を先に出してから、アイテムを わたす
    const lines: DialogueLine[] = [
      guide,
      { speaker: box, text: t('field.chestOpen', { item: chest.itemName, n: chest.count }) },
    ];
    if (item?.use?.heal) lines.push({ text: t('field.specialtyUse', { n: item.use.heal }) });
    lines.push({ text: t('field.specialtyStamp', this.stampCount()) });
    await this.talk(lines);
    await this.checkMeisan();
    this.busy = false;
  }

  // ───────────────────────── バトル ─────────────────────────

  /**
   * 歩数エンカウント。出現表・歩数・確率は content/prefectures/<県>.json の encounters に従う。
   * フィールドでは 立っている 地面（すなはま・もり・やま …）の 出現表を つかう（src/core/world/ground.ts）
   */
  private checkRandomEncounter(): void {
    // 開発者モード中は ふつうの モンスターと 出会わない（中ボス・県ボス・ラスボスは そのまま）
    if (this.devAll()) return;
    const mapZone = zoneForMap(this.mapKey);
    const area = this.currentArea();
    if (!mapZone || !area) return;
    const ground = mapZone === 'field' ? this.groundHere() : null;
    const zone = zoneForGround(area, mapZone, ground);
    const table = area.encounters.find((e) => e.zone === zone);
    if (!table) return;
    if (this.stepCount % table.stepsPerCheck !== 0 || !this.rng.chance(table.rate)) return;
    const enemyId = pickEncounter(area, zone, this.rng);
    if (enemyId)
      this.startBattle({
        enemyId,
        level: encounterLevel(this.heroLevel(), this.rng),
        zone,
        ...(ground ? { ground } : {}),
      });
  }

  /** 立っている マスの 地面（フィールド・島だけ。町・ダンジョンは null） */
  private groundHere(): Ground | null {
    const k = this.kind();
    if ((k !== 'field' && k !== 'enclave') || !this.player) return null;
    const [x, y] = this.playerTile();
    return groundOfTile(this.map.getTileAt(x, y, true, 'background')?.index);
  }

  /** 白く 2 回ちらついてから 暗転 → バトルへ（画面は回さない。Overworld は pause して下に残す） */
  private startBattle(data: BattleSceneData): void {
    if (this.inBattle) return;
    this.inBattle = true;
    this.moving = false;
    this.standStill();
    render(null, this.root('dialogue'));
    this.renderHud();
    playSfx('encounter');
    const cam = this.cameras.main;
    cam.flash(90, 255, 255, 255);
    this.time.delayedCall(180, () => cam.flash(90, 255, 255, 255));
    this.time.delayedCall(360, () => cam.fade(360, 0, 0, 0));
    this.time.delayedCall(760, () => {
      this.scene.launch('Battle', { ...data, devMode: this.devAll() });
      this.scene.pause();
    });
  }

  private onBattleEnd(p: BattleEndPayload): void {
    this.scene.resume();
    this.inBattle = false;
    this.stepCount = 0;
    const cam = this.cameras.main;
    cam.resetFX();
    cam.setRotation(0);
    cam.setZoom(ZOOM);
    cam.fadeIn(300, 0, 0, 0);
    this.renderHud();
    const wasMidBoss = this.pendingMidBoss;
    const wasAreaBoss = this.pendingAreaBoss;
    const wasLastBoss = this.pendingLastBoss;
    this.pendingMidBoss = false;
    this.pendingAreaBoss = false;
    this.pendingLastBoss = false;
    // たいせんじょうの しょうぶは 負けても やどやに もどらない
    const arena = this.pendingArena;
    this.pendingArena = null;
    if (arena) {
      void this.arenaAfter(arena, p.outcome === 'victory');
      return;
    }
    if (p.outcome === 'defeat') {
      // 最後に泊まった宿屋へ。まだ泊まっていなければ今のマップの出発地点へ。
      const inn = this.gs()?.progress.lastInn;
      if (inn) this.switchMap(inn.map, 'spawn', [Math.floor(inn.x / TILE), Math.floor(inn.y / TILE)], true);
      else this.switchMap(this.mapKey, 'spawn');
      return;
    }
    if (wasMidBoss && p.outcome === 'victory') void this.midBossDefeated();
    if (wasAreaBoss && p.outcome === 'victory') void this.areaBossDefeated();
    if (wasLastBoss && p.outcome === 'victory') void this.lastBossDefeated();
  }

  // ───────────────────────── 画面（DOM） ─────────────────────────

  private root(name: RootName): HTMLDivElement {
    let el = this.roots.get(name);
    if (!el) {
      el = document.createElement('div');
      el.className = `nq-root-${name}`;
      document.getElementById('ui-layer')!.appendChild(el);
      this.roots.set(name, el);
    }
    return el;
  }

  /** DOM の部品を出して、閉じられるまで待つ */
  private show(name: RootName, make: (done: () => void) => ComponentChild): Promise<void> {
    return new Promise((resolve) => {
      const root = this.root(name);
      render(
        make(() => {
          render(null, root);
          resolve();
        }),
        root,
      );
    });
  }

  private talk(lines: DialogueLine[]): Promise<void> {
    return this.choose(lines).then(() => undefined);
  }

  /** 会話を出す。choices があれば最後の行で選ばせて、その番号を返す（選択肢なしは -1） */
  private choose(lines: DialogueLine[], choices?: string[]): Promise<number> {
    return new Promise((resolve) => {
      const root = this.root('dialogue');
      render(
        h(DialogueOverlay, {
          lines,
          choices,
          onComplete: (c: number) => {
            render(null, root);
            this.inputLockUntil = this.time.now + 250;
            this.waitRelease = true;
            resolve(c);
          },
        }),
        root,
      );
    });
  }

  private renderHud(): void {
    const root = this.root('hud');
    if (this.inBattle) {
      render(null, root);
      return;
    }
    const { title, sub } = this.placeName();
    render(
      h(FieldHud, {
        title,
        sub,
        stamps: this.kind() === 'field' && this.stampIds.length ? this.stampCount() : null,
        stampLabel: t('field.stamps'),
        map: this.regionMiniView(),
        mapLabel: t('field.areaMapOpen'),
        onAreaMap: () => this.openAreaMap(),
        partyLabel: t('field.party'),
        onParty: () => this.openBag(),
        menuLabel: t('field.menu'),
        onMenu: () => this.openMenu(),
        idle: this.hudIdle,
        dev: this.devAvailable()
          ? {
              label: t(this.devAll() ? 'field.devOn' : 'field.devLabel'),
              on: this.devAll(),
              onToggle: () => this.toggleDev(),
            }
          : undefined,
      }),
      root,
    );
  }

  // ───────────────────────── 開発者モード ─────────────────────────

  /** 開発者モードの ボタンを 出すか（開発サーバー、または URL に ?dev） */
  private devAvailable(): boolean {
    return import.meta.env.DEV || new URLSearchParams(location.search).has('dev');
  }

  /** 開発者モード中：ぜんぶの 県・町・ダンジョン・島・名所へ ワープできる（セーブの counters の dev:all） */
  private devAll(): boolean {
    return (this.gs()?.progress.counters[DEV_ALL_KEY] ?? 0) > 0;
  }

  private toggleDev(): void {
    const gs = this.gs();
    if (!gs || this.busy || this.inBattle || this.moving) return;
    const on = !this.devAll();
    const next = structuredClone(gs);
    if (on) next.progress.counters[DEV_ALL_KEY] = 1;
    else delete next.progress.counters[DEV_ALL_KEY];
    this.setGame(next);
    playSfx(on ? 'recruit' : 'back');
    if (on) this.cameras.main.flash(200, 255, 255, 255);
    this.renderHud();
    this.busy = true;
    this.standStill();
    void this.talk([{ text: t(on ? 'field.devEnabled' : 'field.devDisabled') }]).then(() => {
      this.busy = false;
    });
  }

  // ───────────────────────── メニュー（ずかん・どうぐ・そうび・みため） ─────────────────────────

  /** メニュー：モンスターずかん・とくさんひんずかん・どうぐ（バッグ）・そうび・みため。つかう・そうびの あとは 同じ タブで 作りなおす */
  private openMenu(): void {
    const c = this.content();
    if (!c || this.inBattle || this.busy || this.moving) return;
    this.busy = true;
    this.standStill();
    playSfx('select');
    const root = this.root('travel');
    const draw = (tab: MenuTab, focusKey?: string, message: string | null = null) => {
      const view = this.menuView(tab);
      render(
        h(MenuOverlay, {
          tab,
          tabs: this.menuTabs(),
          entries: view.entries,
          roadmap: this.roadmapNodes(),
          summary: view.summary,
          empty: view.empty,
          message,
          focusKey,
          keys: t('field.menuKeys'),
          onTab: (next: MenuTab) => draw(next),
          onAct: (key: string) => draw(tab, key, this.menuAct(tab, key)),
          onParent: () => {
            const game = this.gs()!;
            render(
              h(ParentOverlay, {
                game,
                mastery: this.roadmapNodes(),
                onChange: (next: GameState) => {
                  this.setGame(next);
                  drawParent();
                },
                onImport: (next: GameState) => this.applyImportedGame(next),
                onClose: () => draw(tab),
              }),
              root,
            );
          },
          onClose: () => {
            playSfx('back');
            render(null, root);
            this.busy = false;
            this.inputLockUntil = this.time.now + 250;
            this.waitRelease = true;
            this.renderHud();
          },
        }),
        root,
      );
    };
    const drawParent = () => {
      const game = this.gs()!;
      render(
        h(ParentOverlay, {
          game,
          mastery: this.roadmapNodes(),
          onChange: (next: GameState) => {
            this.setGame(next);
            drawParent();
          },
          onImport: (next: GameState) => this.applyImportedGame(next),
          onClose: () => draw('roadmap'),
        }),
        root,
      );
    };
    draw('roadmap');
  }

  /** 保護者メニューから読み込んだセーブの場所へ、画面も同時に移す。 */
  private applyImportedGame(next: GameState): void {
    this.setGame(next);
    const { x, y } = next.progress.position;
    this.switchMap(next.progress.currentMap, 'spawn', [Math.floor(x / TILE), Math.floor(y / TILE)], true);
  }

  /** 主人公の いまの ステータス（そうび こみ） */
  private heroStats(gs: GameState) {
    return partyFromGameState(gs, this.content()!).hero.stats;
  }

  /** 図鑑の県順。ストーリー順ではなく、北海道から沖縄へ北→南。 */
  private areaOrder(): string[] {
    return [...new Set([...GEOGRAPHIC_AREA_ORDER, ...(this.content()?.areas.keys() ?? [])])];
  }

  /** 特産品（たべもの・こうげいひん の モチーフ）ぜんぶ。見つけた＝スタンプ か どうぐを 手に入れたことがある */
  private specialtyList(gs: GameState) {
    const c = this.content()!;
    const revealAll = this.devAll();
    const out: { area: Area; motif: Motif; itemId: string; item?: Item; known: boolean }[] = [];
    const areas = this.areaOrder().flatMap((id) => c.areas.get(id) ?? []);
    for (const area of areas)
      for (const motif of area.motifs) {
        if (!SPECIALTY_KINDS.has(motif.kind)) continue;
        const itemId = `${area.id}-${motif.id}`;
        const known =
          revealAll ||
          gs.dex.motifs.includes(motifStamp(area.id, motif.id)) ||
          gs.dex.items.includes(itemId) ||
          (gs.inventory[itemId] ?? 0) > 0;
        out.push({ area, motif, itemId, item: c.items.get(itemId), known });
      }
    return out;
  }

  /** モンスター（県の じゅん、ボスは さいご）。であった＝図鑑にのった か 仲間 */
  private monsterList(gs: GameState) {
    const c = this.content()!;
    const revealAll = this.devAll();
    const order = this.areaOrder();
    const rank = (m: Monster) => (order.includes(m.area) ? order.indexOf(m.area) : order.length);
    const seen = new Set([...gs.dex.monsters, ...gs.party.owned.map((o) => o.monsterId)]);
    return [...c.monsters.values()]
      .sort((a, b) => rank(a) - rank(b) || Number(a.isBoss) - Number(b.isBoss))
      .map((m) => ({ m, known: revealAll || seen.has(m.id) }));
  }

  private menuTabs() {
    return [
      { key: 'roadmap' as const, label: t('field.tabRoadmap'), icon: 'star' },
      {
        key: 'monsters' as const,
        label: t('field.tabMonsters'),
        group: t('field.dexGroup'),
        icon: 'boss',
      },
      {
        key: 'specialties' as const,
        label: t('field.tabSpecialties'),
        group: t('field.dexGroup'),
        icon: 'star',
      },
      { key: 'bag' as const, label: t('field.tabBag'), icon: 'role-shop' },
      { key: 'equip' as const, label: t('field.tabEquip'), icon: 'role-smith' },
      { key: 'look' as const, label: t('field.tabLook'), icon: 'hero' },
    ];
  }

  /** そうびの ステータス（こうげき+3 ぼうぎょ+2） */
  private statText(it: Item): string {
    const KEY: Record<string, string> = {
      hp: 'field.statHp',
      atk: 'field.statAtk',
      def: 'field.statDef',
      spd: 'field.statSpd',
      wis: 'field.statWis',
    };
    return Object.entries(it.stats ?? {})
      .map(([k, v]) => `${KEY[k] ? t(KEY[k]) : k.toUpperCase()}+${v}`)
      .join('　');
  }

  private kindLabel(it: Item): string {
    if (it.kind === 'consumable') return t('field.itemKindTool');
    if (it.kind === 'material') return t('field.itemKindMaterial');
    if (it.kind === 'key') return t('field.itemKindKey');
    return t('field.itemKindEquip', { slot: t(`slots.${it.kind}`) });
  }

  /** タブの 中身 */
  private menuView(tab: MenuTab): { entries: MenuEntry[]; summary?: string; empty: string } {
    const c = this.content()!;
    const gs = this.gs()!;
    const unknown = t('field.dexUnknown');
    const areaName = (id: string) => c.areas.get(id)?.name ?? unknown;
    const stats = this.heroStats(gs);
    const hpLine = t('field.menuHp', { hp: gs.player.hp, max: stats.hp, gold: gs.player.gold });

    if (tab === 'roadmap') return { entries: [], empty: '' };

    if (tab === 'monsters') {
      const owned = new Set(gs.party.owned.map((o) => o.monsterId));
      const monsters = this.monsterList(gs);
      const entries = monsters.map(({ m, known }, i): MenuEntry => {
        const art = this.monsterArtUrl(m);
        const area = t('field.dexArea', { area: areaName(m.area) });
        return {
          key: m.id,
          name: known ? m.name : unknown,
          icon: art,
          art,
          known,
          right: t('field.dexNo', { n: String(i + 1).padStart(3, '0') }),
          detailIndex: `${i + 1}/${monsters.length}`,
          tag: owned.has(m.id) ? t('field.dexOwned') : undefined,
          sub: known ? t(`elements.${m.element}`) : undefined,
          lines: known
            ? [
                area,
                m.weakness
                  ? t('field.dexWeak', { el: t(`elements.${m.weakness}`) })
                  : t('battle.weaknessUnknown'),
              ]
            : [area, t('field.dexNotSeen')],
          blurb: known ? m.dexBlurb : undefined,
          action: null,
        };
      });
      return { entries, empty: t('field.dexEmpty') };
    }

    if (tab === 'specialties') {
      const specialties = this.specialtyList(gs);
      const entries = specialties.map(({ area, motif, itemId, item, known }, i): MenuEntry => ({
        key: itemId,
        name: known ? motif.name : unknown,
        icon: item ? itemIconUrl(item) : undefined,
        known,
        // リストの 右はしは 小さいので ふりがなを つけず かなで
        right: kana(area.name),
        detailIndex: `${i + 1}/${specialties.length}`,
        sub: t(MOTIF_KIND_KEY[motif.kind]),
        lines: known
          ? [
              t('field.dexFrom', { area: area.name }),
              ...(item?.use?.heal ? [t('field.bagHeal', { n: item.use.heal })] : []),
              t('field.townHave', { n: gs.inventory[itemId] ?? 0 }),
            ]
          : [t('field.dexFrom', { area: area.name }), t('field.dexNotFound')],
        blurb: known ? motif.blurb : undefined,
        action: null,
      }));
      return { entries, empty: t('field.dexEmpty') };
    }

    if (tab === 'bag') {
      const ORDER = ['consumable', 'weapon', 'head', 'chest', 'legs', 'feet', 'material', 'key'];
      const max = { hp: stats.hp, mp: stats.mp };
      const entries = Object.entries(gs.inventory)
        .filter(([id, n]) => n > 0 && c.items.has(id))
        .map(([id, n]) => ({ it: c.items.get(id)!, n }))
        .sort((a, b) => ORDER.indexOf(a.it.kind) - ORDER.indexOf(b.it.kind))
        .map(({ it, n }): MenuEntry => {
          const lines = [t('field.townHave', { n })];
          if (it.use?.heal) lines.push(t('field.bagHeal', { n: it.use.heal }));
          if (isEquip(it) && it.stats) lines.push(this.statText(it));
          return {
            key: it.id,
            name: it.name,
            icon: itemIconUrl(it),
            known: true,
            right: t('battle.itemCount', { n }),
            sub: this.kindLabel(it),
            lines,
            blurb: it.blurb,
            action: isEquip(it)
              ? { label: t('field.bagEquip'), ok: true }
              : it.kind === 'consumable' && it.use
                ? { label: t('field.bagUse'), ok: canUse(gs, it, max) }
                : null,
          };
        });
      return { entries, summary: hpLine, empty: t('field.bagEmpty') };
    }

    if (tab === 'look') {
      const ap = gs.player.appearance;
      const entries = LOOK_PARTS.flatMap(({ part, key }) =>
        t(`field.${key}Names`)
          .split(',')
          .map((name, i): MenuEntry => {
            const look = { ...ap, [part]: i };
            const now = ap[part] === i;
            const art = this.heroFrameUrl(look);
            return {
              key: `look:${part}:${i}`,
              name: t('field.lookName', { part: t(`field.${key}`), name }),
              icon: art,
              art,
              known: true,
              tag: now ? t('field.lookNow') : undefined,
              sub: t('field.lookSub', { part: t(`field.${key}`) }),
              lines: [],
              action: { label: t('field.lookPick'), ok: !now },
            };
          }),
      );
      return { entries, summary: t('field.lookSummary'), empty: t('field.dexEmpty') };
    }

    // そうび：5 つの 部位
    const entries = EQUIP_SLOTS.map((slot): MenuEntry => {
      const id = gs.player.equipment[slot];
      const it = id ? c.items.get(id) : undefined;
      return {
        key: `slot:${slot}`,
        name: it ? it.name : t('field.equipNone'),
        icon: it ? itemIconUrl(it) : undefined,
        known: true,
        right: t(`slots.${slot}`),
        sub: t('field.equipSlot', { slot: t(`slots.${slot}`) }),
        lines: it ? [this.statText(it)].filter(Boolean) : [t('field.equipEmptyHint')],
        blurb: it?.blurb,
        action: it ? { label: t('field.bagUnequip'), ok: true } : null,
      };
    });
    return {
      entries,
      summary: t('field.equipStats', {
        hp: gs.player.hp,
        max: stats.hp,
        atk: stats.atk,
        def: stats.def,
        spd: stats.spd,
        wis: stats.wis,
      }),
      empty: t('field.dexEmpty'),
    };
  }

  /** 単元習熟度を唯一の進捗源として、ロードマップ表示用へ変換する。 */
  private roadmapNodes(): RoadmapNode[] {
    const c = this.content()!;
    const gs = this.gs()!;
    return buildRoadmapNodes({
      units: c.units.values(),
      mastery: gs.learning.mastery,
      playerGrade: gs.learning.grade,
      challengeHigher: gs.learning.challengeHigher,
      subjectLabel: (subject) => t(`subjects.${subject}`),
    });
  }

  /** どうぐ・そうびの タブで Z：つかう・そうびする・はずす。ひとことを かえす */
  private menuAct(tab: MenuTab, key: string): string | null {
    const c = this.content()!;
    const gs = this.gs()!;
    const max = this.heroStats(gs);
    if (tab === 'look') {
      const [, part, n] = key.split(':');
      const lp = LOOK_PARTS.find((x) => x.part === part);
      const i = Number(n);
      if (!lp || gs.player.appearance[lp.part] === i) return null;
      const appearance = { ...gs.player.appearance, [lp.part]: i };
      this.setGame({ ...gs, player: { ...gs.player, appearance } });
      playSfx('select');
      return t('field.lookPicked', {
        part: t(`field.${lp.key}`),
        name: t(`field.${lp.key}Names`).split(',')[i] ?? '',
      });
    }
    if (tab === 'equip') {
      const slot = EQUIP_SLOTS.find((s) => `slot:${s}` === key);
      const id = slot && gs.player.equipment[slot];
      const next = slot && unequip(gs, slot);
      if (!next || !id) return null;
      this.commitEquip(next);
      playSfx('select');
      return t('field.bagUnequipped', { item: c.items.get(id)?.name ?? id });
    }
    const it = c.items.get(key);
    if (!it) return null;
    if (isEquip(it)) return this.equipToBag(gs, it).msg;
    const used = useItem(gs, it, { hp: max.hp, mp: max.mp });
    if (!used) {
      playSfx('miss');
      return t('field.bagFull');
    }
    this.setGame(used.state);
    playSfx('recruit');
    return t('field.bagUsed', { item: it.name, n: used.healed });
  }

  // ───────────────────────── バッグ（なかまと そうびの マス）・しんか ─────────────────────────

  /**
   * バッグ：主人公と、バッグの マス（仲間・そうび）と、あずけている 仲間・そうび を見て、
   * バッグに いれる ⇄ だす、せんとう（バトルで さいしょに出る）を えらぶ、しんかさせる。
   * そのあとは 同じ ものを えらんだまま ひらき直す（message に ひとこと）。
   * key は 'hero' / 'mon:<uid>' / 'eq:<部位>'（バッグの そうび）/ 'inv:<itemId>'（あずけている そうび）
   */
  private openBag(focusKey?: string, message: string | null = null, flashKey?: string): void {
    const c = this.content();
    const gs = this.gs();
    if (!c || !gs || this.inBattle) return;
    const reopen = focusKey !== undefined;
    if (!reopen && (this.busy || this.moving)) return;
    this.busy = true;
    this.standStill();
    if (!reopen) playSfx('select');
    const root = this.root('travel');
    const close = () => {
      render(null, root);
      this.busy = false;
      this.inputLockUntil = this.time.now + 250;
      this.waitRelease = true;
    };
    const view = this.bagView(gs);
    const nameOf = (key: string) => view.all.get(key)?.name ?? '';
    const again = (key: string, msg: string | null, flash?: string) => this.openBag(key, msg, flash);
    render(
      h(BagOverlay, {
        ...view.props,
        focusKey,
        message,
        flashKey,
        onToggle: (key: string) => {
          const cur = this.gs();
          const x = view.all.get(key);
          if (!cur || !x) return;
          const ctx = bagContext(cur, c);
          if (x.kind === 'monster') {
            const { state, result } = toggleBagMonster(cur, key.slice('mon:'.length), ctx);
            if (result === 'full') {
              playSfx('miss');
              again(key, t('field.bagFullMsg', { free: bagUsage(cur, ctx).free }));
            } else if (result === 'roster-full') {
              playSfx('miss');
              again(key, t('field.bagRosterFull'));
            } else if (result !== 'none') {
              this.setGame(state);
              again(
                key,
                t(
                  result === 'added'
                    ? 'field.bagAdded'
                    : result === 'benched'
                      ? 'field.bagBenched'
                      : 'field.bagRemoved',
                  { name: x.name },
                ),
              );
            }
            return;
          }
          // バッグの そうびは はずして あずける。あずけている そうびは バッグに いれて そうびする
          const slot = EQUIP_SLOTS.find((s) => `eq:${s}` === key);
          const id = slot && cur.player.equipment[slot];
          if (slot && id) {
            const next = unequip(cur, slot);
            if (!next) return;
            this.commitEquip(next);
            again(`inv:${id}`, t('field.bagRemoved', { name: x.name }));
            return;
          }
          const it = c.items.get(key.slice('inv:'.length));
          if (!it || !isEquip(it)) return;
          const put = this.equipToBag(cur, it);
          again(put.ok ? `eq:${it.kind}` : key, put.msg);
        },
        onLeader: (key: string) => {
          const cur = this.gs();
          if (!cur) return;
          this.setGame(setLeader(cur, key.slice('mon:'.length)));
          again(key, t('field.partyLeaderSet', { name: nameOf(key) }));
        },
        onEvolve: (key: string) => {
          const cur = this.gs();
          const uid = key.slice('mon:'.length);
          // しんかすると マスが ふえるので、バッグに 入りきらないときは しんか できない
          const next =
            cur && evolveRoom(cur, uid, bagContext(cur, c)).ok ? evolve(cur, uid, c.monsters) : null;
          const o = next?.party.owned.find((x) => x.uid === uid);
          if (!next || !o) {
            playSfx('miss');
            return;
          }
          const before = cur && c.monsters.get(cur.party.owned.find((x) => x.uid === uid)?.monsterId ?? '');
          const after = c.monsters.get(o.monsterId);
          this.setGame(next);
          playSfx('recruit');
          this.cameras.main.flash(300, 255, 255, 255);
          const to = o.nickname ?? after?.name ?? '';
          // わざも しんか（ひのこ → ほのおのまい）・あたらしい わざ
          const change =
            before && after ? skillChanges(before, after, c.skills) : { evolved: [], learned: [] };
          const lines = [
            t('field.partyEvolved', { from: nameOf(key), to }),
            ...change.evolved.map(([a, b]) => t('field.partySkillEvolved', { from: a.name, to: b.name })),
            ...change.learned.map((sk) => t('field.partySkillLearned', { name: sk.name })),
          ];
          again(key, lines.join('\n'), key);
        },
        onMove: (key: string, x: number, y: number) => {
          const cur = this.gs();
          if (!cur) return;
          const next = moveBagThing(cur, key, { x, y }, bagContext(cur, c));
          if (!next) {
            playSfx('miss');
            again(key, t('field.bagPlaceBlocked'));
            return;
          }
          this.setGame(next);
          playSfx('move');
          again(key, t('field.bagMoved'));
        },
        onRosterRemove: (key: string) => {
          const cur = this.gs();
          if (!cur) return;
          this.setGame(removeFromRoster(cur, key.slice('mon:'.length)));
          playSfx('back');
          again(key, t('field.bagRosterRemoved', { name: nameOf(key) }));
        },
        onClose: () => {
          playSfx('back');
          close();
        },
      }),
      root,
    );
  }

  /** バッグの 画面の 中身：主人公・バッグの 中身（仲間 → そうび）・あずけている もの（仲間 → そうび）・マス */
  private bagView(gs: GameState) {
    const c = this.content()!;
    const ctx = bagContext(gs, c);
    const usage = bagUsage(gs, ctx);
    const level = heroLevel(gs, c.xp.hero);
    const skills = (ids: string[]) =>
      ids.flatMap((id) => {
        const sk = c.skills.get(id);
        return sk ? [{ name: sk.name, gauge: sk.gauge, scan: sk.effect === 'scan' }] : [];
      });
    const heroC = partyFromGameState(gs, c).hero;
    const hero: BagThing = {
      key: 'hero',
      kind: 'hero',
      name: gs.player.name,
      icon: null,
      art: this.textures.exists(this.heroTex)
        ? this.textures.getBase64(this.heroTex, walkFrame('down', 1))
        : null,
      cost: 1,
      size: { w: 1, h: 1 },
      inBag: true,
      level,
      stats: heroC.stats,
      skills: skills(heroC.skills),
      lines: adjacencyBonus(gs, ctx, gs.player.baseStats).labels,
    };
    const bagUids = bagMonsterUids(gs);
    const roster = new Set([...bagUids, ...gs.party.reserve]);
    const monster = (o: GameState['party']['owned'][number]): BagThing[] => {
      const def = c.monsters.get(o.monsterId);
      if (!def) return [];
      const m = makeMonster(def, o.level, o.uid);
      const evo = evolutionOf(gs, o, c.monsters);
      const room = evolveRoom(gs, o.uid, ctx);
      const art = this.monsterArtUrl(def);
      const inBag = bagUids.includes(o.uid);
      return [
        {
          key: `mon:${o.uid}`,
          kind: 'monster',
          name: o.nickname ?? def.name,
          icon: art,
          art,
          cost: monsterCost(def.id, c.monsters),
          size: monsterSize(def.id, c.monsters),
          inBag,
          roster: roster.has(o.uid),
          leader: inBag && bagUids[0] === o.uid,
          level: o.level,
          element: def.element,
          stats: m.stats,
          skills: skills(m.skills),
          blurb: def.dexBlurb,
          evolve: evo
            ? {
                toName: evo.to.name,
                itemName: c.items.get(evo.itemId)?.name ?? evo.itemId,
                need: evo.need,
                have: evo.have,
                ok: evo.ok,
                room: room.ok,
                extra: room.extra,
              }
            : null,
        },
      ];
    };
    const equip = (it: Item, key: string, count?: number): BagThing => ({
      key,
      kind: 'equip',
      name: it.name,
      icon: itemIconUrl(it),
      art: itemIconUrl(it),
      cost: 1,
      size: { w: 1, h: 1 },
      inBag: key.startsWith('eq:'),
      count,
      sub: t('field.equipSlot', { slot: t(`slots.${it.kind}`) }),
      lines: [this.statText(it), count === undefined ? '' : t('field.townHave', { n: count })].filter(
        Boolean,
      ),
      blurb: it.blurb,
    });
    const owned = new Map(gs.party.owned.map((o) => [o.uid, o]));
    const inBag = [
      ...bagUids.flatMap((u) => monster(owned.get(u)!)),
      ...EQUIP_SLOTS.flatMap((s) => {
        const it = c.items.get(gs.player.equipment[s] ?? '');
        return it ? [equip(it, `eq:${s}`)] : [];
      }),
    ];
    const rank = (it: Item) => (EQUIP_SLOTS as readonly string[]).indexOf(it.kind);
    const stored = Object.entries(gs.inventory)
      .flatMap(([id, n]) => {
        const it = c.items.get(id);
        return it && n > 0 && isEquip(it) ? [{ it, n }] : [];
      })
      .sort((a, b) => rank(a.it) - rank(b.it))
      .map(({ it, n }) => equip(it, `inv:${it.id}`, n));
    const outside = [...gs.party.owned.filter((o) => !bagUids.includes(o.uid)).flatMap(monster), ...stored];
    return {
      all: new Map([hero, ...inBag, ...outside].map((x) => [x.key, x])),
      props: {
        hero,
        inBag,
        outside,
        cells: bagCells(
          [hero, ...inBag].flatMap((x) => {
            const p = gs.party.bagPlacements[x.key];
            const s = x.size ?? { w: 1, h: 1 };
            return p ? [{ key: x.key, x: p.x, y: p.y, w: s.w, h: s.h }] : [];
          }),
          ctx.cols,
          ctx.rows,
        ),
        cols: ctx.cols,
        rows: ctx.rows,
        used: usage.used,
        capacity: usage.capacity,
        over: usage.over,
        nextLevel: nextSlotLevel(level, c.settings.bag),
      },
    };
  }

  /** そうびを バッグに いれる（＝そうびする）。マスが たりなければ いれない。ひとことを かえす */
  private equipToBag(gs: GameState, it: Item): { ok: boolean; msg: string | null } {
    const c = this.content()!;
    const ctx = bagContext(gs, c);
    const put = putEquip(gs, it, ctx);
    if (put.result === 'none') return { ok: false, msg: null };
    if (put.result === 'full') {
      playSfx('miss');
      return { ok: false, msg: t('field.bagFullMsg', { free: bagUsage(gs, ctx).free }) };
    }
    this.commitEquip(put.state);
    playSfx('recruit');
    return {
      ok: true,
      msg: t(put.result === 'swapped' ? 'field.bagEquipSwapped' : 'field.bagEquipAdded', { name: it.name }),
    };
  }

  /** そうびを かえた GameState を セーブ。さいだい HP・MP が へったら、いまの HP・MP も あわせる */
  private commitEquip(next: GameState): void {
    const m = this.heroStats(next);
    next.player.hp = Math.min(next.player.hp, m.hp);
    next.player.mp = Math.min(next.player.mp, m.mp);
    this.setGame(next);
  }

  /** モンスターの絵（手描き、無ければ属性の形で自動生成）を data URL に。バッグ・ずかんで使う */
  private monsterArtUrl(def: Monster): string {
    return monsterMenuArtUrl(def);
  }

  // ───────────────────────── 県の地図（左上の小さな地図・ワープ） ─────────────────────────

  /** 左上の小さな地図：いまいる地方（島）の県。行ったことのある県（visit:<県>-… がある）だけ はっきり */
  private regionMiniView(): RegionMiniView | null {
    const data = this.cache.json.get(WORLD_MAP_KEY) as WorldMapData | undefined;
    const areaId = this.areaId();
    const region = data?.regions.find((r) => r.areas.some((a) => a.id === areaId));
    if (!region) return null;
    const been = this.visitedAreas();
    const here = region.areas.findIndex((a) => a.id === areaId);
    // いまいる県のマスの範囲。主人公は その中の だいたいの位置（フィールドでの位置の割合）に、小数のまま置く
    const letter = String.fromCharCode(97 + here);
    let focus: [number, number, number, number] | null = null;
    region.rows.forEach((row, y) =>
      [...row].forEach((c, x) => {
        if (c !== letter) return;
        focus = focus
          ? [Math.min(focus[0], x), Math.min(focus[1], y), Math.max(focus[2], x), Math.max(focus[3], y)]
          : [x, y, x, y];
      }),
    );
    const f = focus as [number, number, number, number] | null;
    // いまいる県は、フィールドの細かい地形（陸の範囲 land）を focus の範囲に のばして重ねる。
    // 主人公の位置も land の中の割合で出す（町・ダンジョンの中なら、その入口）
    const base = this.baseMap?.key.endsWith('-field') ? this.baseMap : null;
    const land = base?.land ?? null;
    const ht = this.heroOnBase();
    const at: [number, number] | undefined =
      land && ht
        ? [
            (ht[0] - land[0] + 0.5) / (land[2] - land[0] + 1),
            (ht[1] - land[1] + 0.5) / (land[3] - land[1] + 1),
          ]
        : this.whereAmI()?.at;
    const cap = here >= 0 ? region.areas[here]!.capital : null;
    const hero: [number, number] | null =
      f && at
        ? [f[0] + at[0] * (f[2] - f[0] + 1), f[1] + at[1] * (f[3] - f[1] + 1)]
        : cap
          ? [cap[0] + 0.5, cap[1] + 0.5]
          : null;
    return {
      id: region.id,
      width: region.width,
      height: region.height,
      rows: region.rows,
      areas: region.areas,
      visited: region.areas.map((a) => been.has(a.id)),
      here,
      hero,
      focus: f,
      detail: base && land ? { key: base.key, tiles: base.tiles, width: base.width, land } : null,
    };
  }

  /** 行ったことのある（ロック解除された）県：セーブの counters に visit:<県>-… がある県と、いまいる県 */
  private visitedAreas(): Set<string> {
    const been = new Set([this.areaId()]);
    // 開発者モードは ぜんぶの 県
    if (this.devAll()) for (const id of this.content()?.areas.keys() ?? []) been.add(id);
    for (const [k, n] of Object.entries(this.gs()?.progress.counters ?? {}))
      if (k.startsWith('visit:') && n > 0) been.add(k.slice('visit:'.length).split('-')[0] ?? '');
    return been;
  }

  /** 地図に出すマップの上の主人公のマス（町・ダンジョンの中なら、その入口） */
  private heroOnBase(): [number, number] | null {
    const base = this.baseMap;
    if (!base) return null;
    if (base.key === this.mapKey) return this.player?.active ? this.playerTile() : null;
    const gate = base.objects.find((o) => o.type === 'transition' && prop(o, 'targetMap') === this.mapKey);
    return gate ? [Math.floor((gate.x ?? 0) / TILE), Math.floor((gate.y ?? 0) / TILE)] : null;
  }

  /** 地図に出すマップのキー：フィールド・島ならそのマップ、町・ダンジョンなら その県のフィールド */
  private baseKey(): string {
    const k = this.kind();
    if (k === 'field' || k === 'enclave') return this.mapKey;
    return this.currentArea()?.mapKeys?.field ?? `${this.areaId()}-field`;
  }

  private readBaseMap(): BaseMap | null {
    const key = this.baseKey();
    const json = this.cache.tilemap.get(key)?.data as RawTiledMap | undefined;
    const tiles = json?.layers.find((l) => l.name === 'background')?.data;
    if (!json || !tiles) return null;
    const enclave = ENCLAVES.find((e) => e.enclaveId === key);
    // 陸（海＝3 以外）のタイルの範囲
    let land: [number, number, number, number] | null = null;
    for (let i = 0; i < tiles.length; i++) {
      if (tiles[i] === 3) continue;
      const x = i % json.width;
      const y = Math.floor(i / json.width);
      land = land
        ? [Math.min(land[0], x), Math.min(land[1], y), Math.max(land[2], x), Math.max(land[3], y)]
        : [x, y, x, y];
    }
    return {
      key,
      name: enclave?.name ?? this.currentArea()?.name ?? key,
      width: json.width,
      height: json.height,
      tiles,
      objects: json.layers.find((l) => l.name === 'objects')?.objects ?? [],
      land,
    };
  }

  /** 入ったことのあるマップを覚える（地図のワープ先になる）。セーブの counters に visit:<マップ> */
  private markVisited(): void {
    const gs = this.gs();
    const key = `visit:${this.mapKey}`;
    if (!gs || gs.progress.counters[key]) return;
    const next = structuredClone(gs);
    next.progress.counters[key] = 1;
    this.setGame(next);
  }

  /** 地図の ★ 看板：どの名所か と、灰（まだ見つけていない）/ 白（チャレンジがまだ）/ 金（ぜんぶ終わった） */
  private signOf(
    o: TiledObject,
    mapKey: string,
  ): { motif: Motif; stamp: string; kind: 'sign-off' | 'sign-todo' | 'sign-done' } | null {
    const area = this.currentArea();
    if (!area) return null;
    const ev =
      o.type === 'event'
        ? area.events.find((e) => e.trigger.map === mapKey && e.trigger.objectName === o.name)
        : undefined;
    const motifId = o.type === 'landmark' ? prop(o, 'motifId') : ev?.motifId;
    const motif = area.motifs.find((m) => m.id === motifId);
    if (!motif) return null;
    const gs = this.gs();
    const stamp = motifStamp(area.id, motif.id);
    const found = gs?.dex.motifs.includes(stamp) ?? false;
    const done = !ev || (gs?.progress.eventsDone.includes(ev.id) ?? false);
    return { motif, stamp, kind: !found ? 'sign-off' : done ? 'sign-done' : 'sign-todo' };
  }

  /** 地図の 特産品の宝箱：どの特産品か と、あけたか */
  private boxOf(o: TiledObject): { motif: Motif; stamp: string; opened: boolean } | null {
    const area = this.currentArea();
    const motif = area?.motifs.find((m) => m.id === prop(o, 'motifId'));
    if (!area || !motif) return null;
    const stamp = motifStamp(area.id, motif.id);
    return { motif, stamp, opened: this.gs()?.dex.motifs.includes(stamp) ?? false };
  }

  /** 左上の地図・ひらいた地図の中身：地形と、入口・中ボス（ワープホール）・★ 看板・特産品の宝箱・主人公 */
  private areaMapView(): AreaMapView | null {
    const base = this.baseMap;
    if (!base) return null;
    const area = this.currentArea();
    const onBase = base.key === this.mapKey;
    let hero: [number, number] | null = onBase && this.player?.active ? this.playerTile() : null;
    const marks: AreaMark[] = [];
    for (const o of base.objects) {
      const x = Math.floor((o.x ?? 0) / TILE);
      const y = Math.floor((o.y ?? 0) / TILE);
      if (o.type === 'transition') {
        const target = String(prop(o, 'targetMap') ?? '');
        const kind = target.endsWith('-town') ? 'town' : target.endsWith('-dungeon') ? 'dungeon' : 'ship';
        marks.push({ x, y, kind });
        // 町・ダンジョンの中にいるときは、その入口に主人公を出す
        if (!onBase && target === this.mapKey) hero = [x, y];
      } else if (o.type === 'midboss' && area?.midBoss) {
        const beaten = this.gs()?.progress.eventsDone.includes(midBossFlag(area.id)) ?? false;
        marks.push({ x, y, kind: beaten ? 'warp' : 'boss' });
      } else if (o.type === 'event' || o.type === 'landmark') {
        const sign = this.signOf(o, base.key);
        if (sign) marks.push({ x, y, kind: sign.kind });
      } else if (o.type === 'specialty') {
        const box = this.boxOf(o);
        if (box) marks.push({ x, y, kind: box.opened ? 'box-open' : 'box' });
      }
    }
    // 県のまわりの地方の地図（行ったことのある県は緑、未踏の県は灰色）。県のフィールドのときだけ
    const region = base.key.endsWith('-field') ? this.regionMiniView() : null;
    return { key: base.key, width: base.width, height: base.height, tiles: base.tiles, marks, hero, region };
  }

  /** ワープできる「いったことの ある ばしょ」：入ったことのある町・ダンジョン・島と、見つけた名所 */
  private places(): Place[] {
    const base = this.baseMap;
    const gs = this.gs();
    const area = this.currentArea();
    if (!base || !gs || !area) return [];
    // 開発者モードは まだ 行っていない 町・ダンジョン・島、見つけていない 名所へも ワープできる
    const dev = this.devAll();
    const been = (k: string) => dev || (gs.progress.counters[`visit:${k}`] ?? 0) > 0;
    const maps: Place[] = [];
    const signs: Place[] = [];
    for (const o of base.objects) {
      const at: [number, number] = [Math.floor((o.x ?? 0) / TILE), Math.floor((o.y ?? 0) / TILE)];
      if (o.type === 'transition') {
        const target = String(prop(o, 'targetMap') ?? '');
        // 同じマップの中の船は、行き先ではない
        if (target === base.key || !been(target) || maps.some((p) => p.map === target)) continue;
        const enc = ENCLAVES.find((e) => e.enclaveId === target);
        const town = target.endsWith('-town');
        const dungeon = target.endsWith('-dungeon');
        maps.push({
          id: `map:${target}`,
          name: town
            ? (area.town?.name ?? t('field.kindTown'))
            : dungeon
              ? t('field.toDungeon')
              : (enc?.name ?? area.name),
          icon: town ? 'town' : dungeon ? 'dungeon' : enc ? 'ship' : 'field',
          at,
          map: target,
          spawn: 'spawn',
        });
      } else if (o.type === 'event' || o.type === 'landmark') {
        const sign = this.signOf(o, base.key);
        if (!sign || (sign.kind === 'sign-off' && !dev)) continue;
        signs.push({
          id: `sign:${sign.stamp}`,
          name: sign.motif.name,
          icon: 'star',
          at,
          map: base.key,
          spawn: 'spawn',
          tile: at,
        });
      } else if (o.type === 'specialty') {
        // あけた特産品の宝箱も、いったことの ある ばしょ
        const box = this.boxOf(o);
        if (!box?.opened) continue;
        signs.push({
          id: `box:${box.stamp}`,
          name: box.motif.name,
          icon: 'chest',
          at,
          map: base.key,
          spawn: 'spawn',
          tile: at,
        });
      }
    }
    return [...maps, ...signs];
  }

  /** ひらいた地図：県の全体を見て、いったことの ある ばしょ へワープする */
  private openAreaMap(): void {
    if (this.busy || this.inBattle || this.moving) return;
    const map = this.areaMapView();
    if (!map || !this.baseMap) return;
    const places = this.places();
    this.busy = true;
    this.standStill();
    playSfx('select');
    const root = this.root('travel');
    const close = () => {
      render(null, root);
      this.busy = false;
      this.inputLockUntil = this.time.now + 250;
      this.waitRelease = true;
    };
    render(
      h(AreaMapOverlay, {
        map,
        title: t('field.areaMap', { name: this.baseMap.name }),
        places,
        onGo: (id: string) => {
          const p = places.find((q) => q.id === id);
          if (!p) return;
          close();
          playSfx('warp');
          this.cameras.main.flash(200, 255, 255, 255);
          this.switchMap(p.map, p.spawn, p.tile);
        },
        // 左上の地図から にほんちずへ（ほかの県へ ワープ）
        worldLabel: t('field.worldMap'),
        onWorldMap: () => {
          close();
          playSfx('select');
          this.openWorldMap();
        },
        onClose: () => {
          playSfx('back');
          close();
        },
      }),
      root,
    );
  }

  /** いまいる場所の名前（RubyText）と種類。HUD の窓と、移動したときの場所の名前で使う */
  private placeName(): { title: string; sub: string } {
    const kind = this.kind();
    const area = this.currentArea();
    const enclave = kind === 'enclave' ? ENCLAVES.find((e) => e.enclaveId === this.mapKey) : undefined;
    const title =
      enclave?.name ??
      (kind === 'town' ? area?.town?.name : kind === 'secret' ? area?.secret?.name : undefined) ??
      area?.name ??
      this.mapKey;
    const sub = t(
      {
        field: 'field.kindField',
        town: 'field.kindTown',
        dungeon: 'field.kindDungeon',
        enclave: 'field.kindEnclave',
        secret: 'field.kindSecret',
      }[kind],
    );
    return { title, sub };
  }

  /**
   * 別の場所（町・ダンジョン・島・となりの県 など）に移動したとき、画面のまん中に場所の名前を出す。
   * 同じマップの中の船や、負けて同じマップの宿へもどったときは出さない
   */
  private showPlaceTitle(): void {
    if (this.registry.get('lastPlaceTitle') === this.mapKey) return;
    this.registry.set('lastPlaceTitle', this.mapKey);
    const { title, sub } = this.placeName();
    void this.show('title', (done) => h(AreaTitle, { name: title, sub, onDone: done }));
  }

  /** にほんちず：地方ごとの地図で、県の進みぐあい（名所・中ボス）を見て、行ったことのある県のフィールドへ行ける */
  private openWorldMap(): void {
    if (this.busy || this.inBattle) return;
    this.busy = true;
    const root = this.root('travel');
    const close = () => {
      render(null, root);
      this.busy = false;
      this.inputLockUntil = this.time.now + 250;
      this.waitRelease = true;
    };
    render(
      h(WorldMapOverlay, {
        regions: this.worldMapRegions(),
        here: this.whereAmI(),
        onGo: (areaId: string) => {
          close();
          this.switchMap(this.content()?.areas.get(areaId)?.mapKeys?.field ?? `${areaId}-field`, 'spawn');
        },
        onClose: close,
      }),
      root,
    );
  }

  /** にほんちずの地方と県。地図は public/worldmap.json、名前は content、進みぐあいはセーブから */
  private worldMapRegions(): MapRegionInfo[] {
    const data = this.cache.json.get(WORLD_MAP_KEY) as WorldMapData | undefined;
    const content = this.content();
    if (!data || !content) return [];
    const gs = this.gs();
    const been = this.visitedAreas();
    const islands = new Map(content.world.islands.map((i) => [i.id, i]));
    const boss = (area: Area | undefined): MapAreaInfo['boss'] => {
      if (!area?.midBoss) return 'none';
      return gs?.progress.eventsDone.includes(midBossFlag(area.id)) ? 'done' : 'yet';
    };
    const regions = data.regions.filter((r) => islands.has(r.id));
    regions.sort((a, b) => islands.get(a.id)!.order - islands.get(b.id)!.order);
    return regions.map((r) => ({
      id: r.id,
      name: islands.get(r.id)!.name,
      width: r.width,
      height: r.height,
      rows: r.rows,
      areas: r.areas.map((a): MapAreaInfo => {
        const area = content.areas.get(a.id);
        // 見つけていない名所は、名前を出さない（null）。特産品（イベントの無い たべもの・こうげいひん）は宝箱
        const stamps = a.stamps.flatMap((id) => {
          const motif = area?.motifs.find((m) => m.id === id);
          if (!motif) return [];
          const box = SPECIALTY_KINDS.has(motif.kind) && !area?.events.some((e) => e.motifId === id);
          return [{ name: gs?.dex.motifs.includes(motifStamp(a.id, id)) ? kana(motif.name) : null, box }];
        });
        return {
          id: a.id,
          name: area?.name ?? a.id,
          capital: a.capital,
          stamps,
          boss: boss(area),
          visited: been.has(a.id),
        };
      }),
    }));
  }

  /** にほんちずの「いま いる ところ」。フィールドなら、県の陸地の中でのだいたいの位置（左上 0 〜 右下 1）も */
  private whereAmI(): { areaId: string; at?: [number, number] } | null {
    const areaId = this.areaId();
    if (!this.content()?.areas.has(areaId)) return null;
    const col = this.colLayer;
    if (this.kind() !== 'field' || !col) return { areaId };
    let x0 = Infinity;
    let y0 = Infinity;
    let x1 = -Infinity;
    let y1 = -Infinity;
    col.forEachTile((tile) => {
      if (tile.index === BLOCK_TILE) return;
      x0 = Math.min(x0, tile.x);
      y0 = Math.min(y0, tile.y);
      x1 = Math.max(x1, tile.x);
      y1 = Math.max(y1, tile.y);
    });
    if (x1 < x0) return { areaId };
    const [px, py] = this.playerTile();
    return { areaId, at: [(px - x0 + 0.5) / (x1 - x0 + 1), (py - y0 + 0.5) / (y1 - y0 + 1)] };
  }

  private switchMap(target: string, spawn = 'spawn', tile?: [number, number], exactSpawn = false): void {
    this.busy = true;
    render(null, this.root('dialogue'));
    const cam = this.cameras.main;
    // タブが うしろに あると フェードアウトが 終わらず、画面が 黒い ままで マップが かわらない。
    // 時間でも かならず すすめる（window の タイマーは タブが うしろでも 動く）
    let moved = false;
    const go = () => {
      if (moved) return;
      moved = true;
      this.scene.restart({ mapKey: target, spawnName: spawn, spawnTile: tile, exactSpawn });
    };
    cam.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, go);
    const guard = window.setTimeout(go, 600);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => window.clearTimeout(guard));
    cam.fadeOut(250, 0, 0, 0);
  }

  /**
   * 止まった ままの フェードイン（画面に かかった 黒い まく）を 消す。
   * タブが うしろに あると Phaser の カメラの フェードは 進まないので、もどってきた ときなどに よぶ
   */
  private clearStuckFade(): void {
    const fx = this.cameras?.main?.fadeEffect;
    if (fx?.isRunning && !fx.direction) this.cameras.main.resetFX();
  }

  // ───────────────────────── 小道具 ─────────────────────────

  private content(): ContentIndex | undefined {
    return this.registry.get('content') as ContentIndex | undefined;
  }

  private gs(): GameState | undefined {
    return this.registry.get('game') as GameState | undefined;
  }

  private setGame(gs: GameState): void {
    this.registry.set('game', gs);
    // 見た目・めいさんひんの そうびが かわったら 主人公の 絵も
    this.refreshHeroLook();
  }

  private rememberLocation(x: number, y: number): void {
    const gs = this.gs();
    if (!gs) return;
    const areaId = this.areaId();
    const currentArea = this.content()?.areas.has(areaId) ? areaId : gs.progress.currentArea;
    if (
      gs.progress.currentMap === this.mapKey &&
      gs.progress.currentArea === currentArea &&
      gs.progress.position.x === x * TILE &&
      gs.progress.position.y === y * TILE
    )
      return;
    this.setGame({
      ...gs,
      progress: {
        ...gs.progress,
        currentMap: this.mapKey,
        currentArea,
        position: { x: x * TILE, y: y * TILE },
      },
    });
  }

  private heroLevel(): number {
    return this.gs()?.player.level ?? 1;
  }

  private kind(): MapKind {
    const k = this.mapKey;
    if (k.endsWith('-town')) return 'town';
    if (k.endsWith('-dungeon')) return 'dungeon';
    if (k.endsWith('-secret')) return 'secret';
    if (k.endsWith('-enclave')) return 'enclave';
    return 'field';
  }

  private areaId(): string {
    return this.mapKey.split('-')[0] ?? '';
  }

  /** このマップの県（content/prefectures） */
  private currentArea(): Area | undefined {
    return this.content()?.areas.get(this.areaId());
  }

  private idx(x: number, y: number): number {
    return y * this.map.width + x;
  }

  private inside(x: number, y: number): boolean {
    return x >= 0 && y >= 0 && x < this.map.width && y < this.map.height;
  }

  private playerTile(): [number, number] {
    return [Math.floor(this.player.x / TILE), Math.floor(this.player.y / TILE)];
  }

  private isBlocked(x: number, y: number): boolean {
    if (this.blocked.has(this.idx(x, y))) return true;
    return this.colLayer?.getTileAt(x, y)?.index === BLOCK_TILE;
  }

  private wait(ms: number): Promise<void> {
    return new Promise((resolve) => this.time.delayedCall(ms, () => resolve()));
  }

  private tweenP(cfg: Phaser.Types.Tweens.TweenBuilderConfig): Promise<void> {
    return new Promise((resolve) => this.tweens.add({ ...cfg, onComplete: () => resolve() }));
  }
}
