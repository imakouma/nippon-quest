import { describe, expect, it } from 'vitest';
import { createNewGame } from '../../src/core/state/newGame';
import {
  DEV_ALL_KEY,
  disableDeveloperTravel,
  developerInnQuarantined,
  developerTravelActive,
  developerVisitQuarantined,
  enableDeveloperTravel,
  normalizeUnavailableDeveloperTravel,
  toggleDeveloperTravel,
} from '../../src/core/progression/developerTravel';
import { unavailableDeveloperSceneRecovery } from '../../src/scenes/overworld/developerScene';
import { content } from './helpers';

describe('開発者モードの移動を進行から分離する', () => {
  it('開始位置を保存し、dev中の現在地からoffにすると元の位置へ戻す', async () => {
    const { world } = await content();
    const game = createNewGame({ name: 'ハル', grade: 3 }, 1_000);
    game.progress.currentIsland = 'tohoku';
    game.progress.currentArea = 'aomori';
    game.progress.currentMap = 'aomori-field';
    game.progress.position = { x: 16 * 12, y: 16 * 34 };
    game.progress.lastInn = { map: 'aomori-town', x: 80, y: 96 };
    game.progress.areaSigns = ['aomori'];
    game.progress.eventsDone = ['midboss.aomori'];
    game.progress.islandsCleared = ['tohoku'];
    const originalCounters = { ...game.progress.counters };

    const enabled = enableDeveloperTravel(game, 2_000);
    expect(enabled.progress.counters[DEV_ALL_KEY]).toBe(1);
    const traveled = structuredClone(enabled);
    traveled.progress.currentIsland = 'kyushu-okinawa';
    traveled.progress.currentArea = 'okinawa';
    traveled.progress.currentMap = 'okinawa-field';
    traveled.progress.position = { x: 16 * 8, y: 16 * 9 };

    const disabled = disableDeveloperTravel(traveled, world, 3_000);
    expect(disabled.progress).toMatchObject({
      currentIsland: 'tohoku',
      currentArea: 'aomori',
      currentMap: 'aomori-field',
      position: { x: 16 * 12, y: 16 * 34 },
      lastInn: { map: 'aomori-town', x: 80, y: 96 },
      areaSigns: ['aomori'],
      eventsDone: ['midboss.aomori'],
      islandsCleared: ['tohoku'],
    });
    expect(
      Object.keys(disabled.progress.counters).filter(
        (key) => key === DEV_ALL_KEY || key.startsWith('dev:return:'),
      ),
    ).toEqual([]);
    expect(game.progress.counters).toEqual(originalCounters);
  });

  it('二重enableで復帰位置を上書きせず、攻略配列とvisit記録を変更しない', () => {
    const game = createNewGame({ name: 'ハル', grade: 3 }, 1_000);
    game.progress.currentMap = 'aomori-field';
    game.progress.position = { x: 32, y: 48 };
    game.progress.counters['visit:aomori-field'] = 1;
    const once = enableDeveloperTravel(game, 2_000);
    once.progress.currentMap = 'iwate-field';
    once.progress.currentArea = 'iwate';
    once.progress.position = { x: 160, y: 176 };
    const twice = enableDeveloperTravel(once, 3_000);
    expect(twice).toBe(once);
    expect(twice.progress.counters['visit:aomori-field']).toBe(1);
    expect(twice.progress.counters['visit:iwate-field']).toBeUndefined();
    expect(twice.progress.areaSigns).toEqual(game.progress.areaSigns);
    expect(twice.progress.eventsDone).toEqual(game.progress.eventsDone);
    expect(twice.progress.islandsCleared).toEqual(game.progress.islandsCleared);
  });

  it('退避情報のない古いdevセーブは未解放の訪問・宿を隔離して既存の安全な訪問先へ戻す', async () => {
    const { world } = await content();
    const base = createNewGame({ name: 'ハル', grade: 3 }, 1_000);
    base.progress.counters[DEV_ALL_KEY] = 1;
    base.progress.currentIsland = 'hokuriku';
    base.progress.currentArea = 'niigata';
    base.progress.currentMap = 'niigata-field';
    base.progress.position = { x: 320, y: 480 };
    base.progress.lastInn = { map: 'niigata-town', x: 80, y: 96 };

    base.progress.counters['visit:aomori-town'] = 1;
    base.progress.counters['visit:niigata-field'] = 1;
    base.progress.counters['visit:tokyo-field'] = 1;
    base.progress.counters['visit:iwate-field'] = 1;
    const restored = disableDeveloperTravel(base, world, 2_000);
    expect(restored.progress).toMatchObject({
      currentIsland: 'tohoku',
      currentArea: 'aomori',
      currentMap: 'aomori-town',
      position: { x: 0, y: 0 },
      lastInn: { map: 'niigata-town', x: 80, y: 96 },
    });
    expect(
      Object.keys(restored.progress.counters)
        .filter((key) => key.startsWith('visit:'))
        .sort(),
    ).toEqual(['visit:aomori-town', 'visit:iwate-field', 'visit:niigata-field', 'visit:tokyo-field']);
    expect(developerVisitQuarantined(restored.progress.counters, 'aomori-town')).toBe(false);
    expect(developerVisitQuarantined(restored.progress.counters, 'iwate-field')).toBe(true);
    expect(developerVisitQuarantined(restored.progress.counters, 'niigata-field')).toBe(true);
    expect(developerVisitQuarantined(restored.progress.counters, 'tokyo-field')).toBe(true);
    expect(developerInnQuarantined(restored.progress.counters, 'niigata-town')).toBe(true);
    restored.progress.areaSigns.push('aomori');
    expect(restored.progress.counters['visit:iwate-field']).toBe(1);
    expect(developerVisitQuarantined(restored.progress.counters, 'iwate-field')).toBe(true);
  });

  it.each(['okinawa-field', 'aomori-enclave', 'aomori-dungeon', 'aomori-secret'])(
    '不整合または実在しない退避map %s は採用せず開始県へ安全復帰する',
    async (invalidMap) => {
      const { world } = await content();
      const game = createNewGame({ name: 'ハル', grade: 3 }, 1_000);
      const enabled = enableDeveloperTravel(game, 2_000);
      enabled.progress.lastInn = { map: 'okinawa-town', x: 80, y: 96 };
      const mapKey = Object.keys(enabled.progress.counters).find((key) => key.startsWith('dev:return:map:'));
      expect(mapKey).toBeDefined();
      delete enabled.progress.counters[mapKey!];
      enabled.progress.counters[`dev:return:map:${encodeURIComponent(invalidMap)}`] = 1;

      const restored = disableDeveloperTravel(enabled, world, 3_000);
      expect(restored.progress).toMatchObject({
        currentIsland: 'tohoku',
        currentArea: 'aomori',
        currentMap: 'aomori-field',
        position: { x: 0, y: 0 },
        lastInn: { map: 'okinawa-town', x: 80, y: 96 },
      });
      expect(developerInnQuarantined(restored.progress.counters, 'okinawa-town')).toBe(true);
    },
  );

  it('旧devセーブでも正規解放済みの訪問履歴と宿だけは保持する', async () => {
    const { world } = await content();
    const game = createNewGame({ name: 'ハル', grade: 3 }, 1_000);
    game.progress.counters[DEV_ALL_KEY] = 1;
    game.progress.areaSigns.push('aomori', 'iwate');
    game.progress.counters['visit:iwate-town'] = 1;
    game.progress.counters['visit:niigata-field'] = 1;
    game.progress.lastInn = { map: 'iwate-town', x: 80, y: 96 };

    const restored = disableDeveloperTravel(game, world, 2_000);
    expect(restored.progress.lastInn).toEqual({ map: 'iwate-town', x: 80, y: 96 });
    expect(restored.progress.counters['visit:iwate-town']).toBe(1);
    expect(restored.progress.counters['visit:niigata-field']).toBe(1);
    expect(developerVisitQuarantined(restored.progress.counters, 'iwate-town')).toBe(false);
    expect(developerVisitQuarantined(restored.progress.counters, 'niigata-field')).toBe(true);
    expect(developerInnQuarantined(restored.progress.counters, 'iwate-town')).toBe(false);
  });

  it('有効な退避情報がある場合は由来を判別できない既存の訪問・宿を破壊しない', async () => {
    const { world } = await content();
    const game = createNewGame({ name: 'ハル', grade: 3 }, 1_000);
    const enabled = enableDeveloperTravel(game, 2_000);
    enabled.progress.counters['visit:iwate-field'] = 1;
    enabled.progress.lastInn = { map: 'iwate-town', x: 80, y: 96 };

    const restored = disableDeveloperTravel(enabled, world, 3_000);
    expect(restored.progress.counters['visit:iwate-field']).toBe(1);
    expect(restored.progress.lastInn).toEqual({ map: 'iwate-town', x: 80, y: 96 });
  });

  it('到達不能な県を退避元に偽装しても開始県へ戻す', async () => {
    const { world } = await content();
    const game = createNewGame({ name: 'ハル', grade: 3 }, 1_000);
    const enabled = enableDeveloperTravel(game, 2_000);
    for (const key of Object.keys(enabled.progress.counters)) {
      if (key.startsWith('dev:return:map:')) delete enabled.progress.counters[key];
      if (key.startsWith('dev:return:area:')) delete enabled.progress.counters[key];
      if (key.startsWith('dev:return:island:')) delete enabled.progress.counters[key];
    }
    enabled.progress.counters[`dev:return:map:${encodeURIComponent('okinawa-field')}`] = 1;
    enabled.progress.counters[`dev:return:area:${encodeURIComponent('okinawa')}`] = 1;
    enabled.progress.counters[`dev:return:island:${encodeURIComponent('kyushu-okinawa')}`] = 1;

    expect(disableDeveloperTravel(enabled, world, 3_000).progress).toMatchObject({
      currentIsland: 'tohoku',
      currentArea: 'aomori',
      currentMap: 'aomori-field',
    });
  });

  it('devフラグだけ消えた到達不能な旧セーブを直し、攻略済みの旧順序位置は維持する', async () => {
    const { world } = await content();
    const polluted = createNewGame({ name: 'ハル', grade: 3 }, 1_000);
    polluted.progress.currentIsland = 'kyushu-okinawa';
    polluted.progress.currentArea = 'okinawa';
    polluted.progress.currentMap = 'okinawa-field';
    polluted.progress.position = { x: 128, y: 144 };
    expect(normalizeUnavailableDeveloperTravel(polluted, world, true, 2_000).progress).toMatchObject({
      currentIsland: 'tohoku',
      currentArea: 'aomori',
      currentMap: 'aomori-field',
      position: { x: 0, y: 0 },
    });

    const legacy = structuredClone(polluted);
    legacy.progress.currentIsland = 'tokai';
    legacy.progress.currentArea = 'gifu';
    legacy.progress.currentMap = 'gifu-town';
    legacy.progress.areaSigns = ['gifu'];
    legacy.progress.islandsCleared = ['tohoku', 'hokkaido', 'kanto', 'hokuriku', 'koshinetsu'];
    expect(normalizeUnavailableDeveloperTravel(legacy, world, true, 2_000)).toBe(legacy);
  });

  it('通常セーブの実在離島は維持し、存在しない同県prefixマップは復旧する', async () => {
    const { world } = await content();
    const game = createNewGame({ name: 'ハル', grade: 3 }, 1_000);
    game.progress.currentIsland = 'hokuriku';
    game.progress.currentArea = 'niigata';
    game.progress.currentMap = 'niigata-enclave';
    game.progress.islandsCleared = ['tohoku', 'hokkaido', 'kanto'];
    game.progress.counters['visit:niigata-enclave'] = 1;
    expect(normalizeUnavailableDeveloperTravel(game, world, true, 2_000)).toBe(game);

    const missing = createNewGame({ name: 'ハル', grade: 3 }, 1_000);
    missing.progress.currentIsland = 'tohoku';
    missing.progress.currentArea = 'aomori';
    missing.progress.currentMap = 'aomori-enclave';
    expect(normalizeUnavailableDeveloperTravel(missing, world, true, 2_000).progress.currentMap).toBe(
      'aomori-field',
    );
  });

  it('県だけ解放済みでも未訪問の町・離島を旧devや欠損フラグの現在地として採用しない', async () => {
    const { world } = await content();
    for (const currentMap of ['niigata-town', 'niigata-enclave']) {
      const polluted = createNewGame({ name: 'ハル', grade: 3 }, 1_000);
      polluted.progress.currentIsland = 'hokuriku';
      polluted.progress.currentArea = 'niigata';
      polluted.progress.currentMap = currentMap;
      polluted.progress.position = { x: 160, y: 176 };
      polluted.progress.islandsCleared = ['tohoku', 'hokkaido', 'kanto'];

      expect(normalizeUnavailableDeveloperTravel(polluted, world, true, 2_000).progress).toMatchObject({
        currentIsland: 'tohoku',
        currentArea: 'aomori',
        currentMap: 'aomori-field',
      });

      polluted.progress.counters[DEV_ALL_KEY] = 1;
      expect(disableDeveloperTravel(polluted, world, 2_000).progress).toMatchObject({
        currentIsland: 'tohoku',
        currentArea: 'aomori',
        currentMap: 'aomori-field',
      });
    }
  });

  it('退避情報のない旧devセーブは未達ダンジョンと裏ステージのvisitを隔離する', async () => {
    const { world } = await content();
    const game = createNewGame({ name: 'ハル', grade: 3 }, 1_000);
    game.progress.counters[DEV_ALL_KEY] = 1;
    game.progress.counters['visit:aomori-dungeon'] = 1;
    game.progress.counters['visit:aomori-secret'] = 1;

    const restored = disableDeveloperTravel(game, world, 2_000);
    expect(restored.progress.counters['visit:aomori-dungeon']).toBe(1);
    expect(restored.progress.counters['visit:aomori-secret']).toBe(1);
    expect(developerVisitQuarantined(restored.progress.counters, 'aomori-dungeon')).toBe(true);
    expect(developerVisitQuarantined(restored.progress.counters, 'aomori-secret')).toBe(true);
  });

  it('実在離島でdevを有効にした場合は正確な元位置へ復帰する', async () => {
    const { world } = await content();
    const game = createNewGame({ name: 'ハル', grade: 3 }, 1_000);
    game.progress.currentIsland = 'hokuriku';
    game.progress.currentArea = 'niigata';
    game.progress.currentMap = 'niigata-enclave';
    game.progress.position = { x: 320, y: 480 };
    game.progress.islandsCleared = ['tohoku', 'hokkaido', 'kanto'];

    const restored = disableDeveloperTravel(enableDeveloperTravel(game, 2_000), world, 3_000);
    expect(restored.progress).toMatchObject({
      currentIsland: 'hokuriku',
      currentArea: 'niigata',
      currentMap: 'niigata-enclave',
      position: { x: 320, y: 480 },
    });
  });

  it('退避情報のない旧devは未攻略ダンジョン・裏ステージを現在地として採用しない', async () => {
    const { areas, world } = await content();
    for (const currentMap of ['aomori-dungeon', 'aomori-secret']) {
      const game = createNewGame({ name: 'ハル', grade: 3 }, 1_000);
      game.progress.counters[DEV_ALL_KEY] = 1;
      game.progress.currentMap = currentMap;
      game.progress.position = { x: 160, y: 176 };

      expect(disableDeveloperTravel(game, world, 2_000, areas).progress).toMatchObject({
        currentIsland: 'tohoku',
        currentArea: 'aomori',
        currentMap: 'aomori-field',
        position: { x: 0, y: 0 },
      });
    }

    const midBossOnly = createNewGame({ name: 'ハル', grade: 3 }, 1_000);
    midBossOnly.progress.counters[DEV_ALL_KEY] = 1;
    midBossOnly.progress.counters['visit:aomori-secret'] = 1;
    midBossOnly.progress.currentMap = 'aomori-secret';
    midBossOnly.progress.eventsDone.push('midboss.aomori');
    const restored = disableDeveloperTravel(midBossOnly, world, 2_000, areas);
    expect(restored.progress.currentMap).toBe('aomori-field');
    expect(developerVisitQuarantined(restored.progress.counters, 'aomori-secret')).toBe(true);

    const missingFlag = structuredClone(midBossOnly);
    delete missingFlag.progress.counters[DEV_ALL_KEY];
    const normalized = normalizeUnavailableDeveloperTravel(missingFlag, world, true, 2_000, areas);
    expect(normalized.progress.currentMap).toBe('aomori-field');
    expect(developerVisitQuarantined(normalized.progress.counters, 'aomori-secret')).toBe(true);
  });

  it('通常の地域ボス攻略で入ったダンジョンは維持し、進行なしのvisitだけを隔離する', async () => {
    const { areas, world } = await content();
    const legitimate = createNewGame({ name: 'ハル', grade: 3 }, 1_000);
    legitimate.progress.currentMap = 'aomori-dungeon';
    legitimate.progress.counters['visit:aomori-dungeon'] = 1;
    legitimate.progress.eventsDone.push(
      ...areas
        .get('aomori')!
        .regions.filter((region) => region.boss)
        .map((region) => `regionboss.aomori.${region.id}`),
    );
    expect(normalizeUnavailableDeveloperTravel(legitimate, world, true, 2_000, areas)).toBe(legitimate);

    const polluted = createNewGame({ name: 'ハル', grade: 3 }, 1_000);
    polluted.progress.currentMap = 'aomori-dungeon';
    polluted.progress.counters['visit:aomori-dungeon'] = 1;
    const normalized = normalizeUnavailableDeveloperTravel(polluted, world, true, 2_000, areas);
    expect(normalized.progress.currentMap).toBe('aomori-field');
    expect(developerVisitQuarantined(normalized.progress.counters, 'aomori-dungeon')).toBe(true);

    const offMapPollution = createNewGame({ name: 'ハル', grade: 3 }, 1_000);
    offMapPollution.progress.counters['visit:aomori-dungeon'] = 1;
    const cleaned = normalizeUnavailableDeveloperTravel(offMapPollution, world, true, 2_000, areas);
    expect(cleaned.progress.currentMap).toBe('aomori-field');
    expect(developerVisitQuarantined(cleaned.progress.counters, 'aomori-dungeon')).toBe(true);
  });

  it('復帰先が壊れていても到達済みの最遠訪問先と宿座標へ決定的に戻す', async () => {
    const { world } = await content();
    const game = createNewGame({ name: 'ハル', grade: 3 }, 1_000);
    game.progress.counters[DEV_ALL_KEY] = 1;
    game.progress.currentIsland = 'kyushu-okinawa';
    game.progress.currentArea = 'okinawa';
    game.progress.currentMap = 'okinawa-field';
    game.progress.areaSigns.push('aomori');
    game.progress.counters['visit:aomori-town'] = 1;
    game.progress.counters['visit:iwate-town'] = 1;
    game.progress.counters['interpref:arrived:iwate'] = 1;
    game.progress.lastInn = { map: 'iwate-town', x: 80, y: 96 };

    expect(disableDeveloperTravel(game, world, 2_000).progress).toMatchObject({
      currentIsland: 'tohoku',
      currentArea: 'iwate',
      currentMap: 'iwate-town',
      position: { x: 80, y: 96 },
    });
  });

  it('退避情報のない旧devが付けた次県visit・宿は、正規到着印がなければ隔離する', async () => {
    const { world } = await content();
    const game = createNewGame({ name: 'ハル', grade: 3 }, 1_000);
    game.progress.counters[DEV_ALL_KEY] = 1;
    game.progress.currentArea = 'iwate';
    game.progress.currentMap = 'iwate-field';
    game.progress.position = { x: 160, y: 176 };
    game.progress.areaSigns.push('aomori');
    game.progress.counters['visit:iwate-field'] = 1;
    game.progress.lastInn = { map: 'iwate-town', x: 80, y: 96 };

    const restored = disableDeveloperTravel(game, world, 2_000);
    expect(restored.progress).toMatchObject({
      currentArea: 'aomori',
      currentMap: 'aomori-field',
    });
    expect(developerVisitQuarantined(restored.progress.counters, 'iwate-field')).toBe(true);
    expect(developerInnQuarantined(restored.progress.counters, 'iwate-town')).toBe(true);
  });

  it('devを使っていない旧セーブの正規visit・宿は、新しい到着印がなくても維持する', async () => {
    const { world } = await content();
    const game = createNewGame({ name: 'ハル', grade: 3 }, 1_000);
    game.progress.currentArea = 'iwate';
    game.progress.currentMap = 'iwate-field';
    game.progress.position = { x: 160, y: 176 };
    game.progress.areaSigns.push('aomori');
    game.progress.counters['visit:iwate-field'] = 1;
    game.progress.lastInn = { map: 'iwate-town', x: 80, y: 96 };

    const normalized = normalizeUnavailableDeveloperTravel(game, world, true, 2_000);
    expect(normalized).toBe(game);
    expect(developerVisitQuarantined(normalized.progress.counters, 'iwate-field')).toBe(false);
    expect(developerInnQuarantined(normalized.progress.counters, 'iwate-town')).toBe(false);
  });

  it('devフラグが消えた通常ロードでも未解放の訪問・宿を削除せず隔離する', async () => {
    const { world } = await content();
    const game = createNewGame({ name: 'ハル', grade: 3 }, 1_000);
    game.progress.counters['visit:niigata-field'] = 1;
    game.progress.lastInn = { map: 'niigata-town', x: 80, y: 96 };

    const normalized = normalizeUnavailableDeveloperTravel(game, world, true, 2_000);
    expect(normalized).not.toBe(game);
    expect(normalized.progress.counters['visit:niigata-field']).toBe(1);
    expect(normalized.progress.lastInn).toEqual({ map: 'niigata-town', x: 80, y: 96 });
    expect(developerVisitQuarantined(normalized.progress.counters, 'niigata-field')).toBe(true);
    expect(developerInnQuarantined(normalized.progress.counters, 'niigata-town')).toBe(true);
  });

  it('退避tagが重複するセーブは挿入順に依存せず安全復帰する', async () => {
    const { world } = await content();
    const game = createNewGame({ name: 'ハル', grade: 3 }, 1_000);
    game.progress.position = { x: 192, y: 544 };
    const enabled = enableDeveloperTravel(game, 2_000);
    enabled.progress.counters[`dev:return:map:${encodeURIComponent('aomori-town')}`] = 1;

    expect(disableDeveloperTravel(enabled, world, 3_000).progress).toMatchObject({
      currentIsland: 'tohoku',
      currentArea: 'aomori',
      currentMap: 'aomori-field',
      position: { x: 0, y: 0 },
    });
  });

  it('toggleは画面の再読込先も一緒に返し、off時は開始タイルへ戻す', async () => {
    const { world } = await content();
    const game = createNewGame({ name: 'ハル', grade: 3 }, 1_000);
    game.progress.currentMap = 'aomori-field';
    game.progress.currentArea = 'aomori';
    game.progress.currentIsland = 'tohoku';
    game.progress.position = { x: 16 * 12, y: 16 * 34 };
    game.progress.counters['visit:aomori-field'] = 1;
    const before = structuredClone(game);

    const enabled = toggleDeveloperTravel(game, world, 'aomori-field', [12, 34]);
    expect(enabled).toMatchObject({
      enabled: true,
      targetMap: 'aomori-field',
      targetTile: [12, 34],
    });
    expect(enabled.game.progress.counters[DEV_ALL_KEY]).toBe(1);
    expect(game).toEqual(before);

    const traveled = structuredClone(enabled.game);
    traveled.progress.currentIsland = 'kyushu-okinawa';
    traveled.progress.currentArea = 'okinawa';
    traveled.progress.currentMap = 'okinawa-field';
    traveled.progress.position = { x: 16 * 8, y: 16 * 9 };
    const disabled = toggleDeveloperTravel(traveled, world, 'okinawa-field', [8, 9]);

    expect(disabled).toMatchObject({
      enabled: false,
      targetMap: 'aomori-field',
      targetTile: [12, 34],
      game: {
        progress: {
          currentIsland: 'tohoku',
          currentArea: 'aomori',
          currentMap: 'aomori-field',
          position: { x: 16 * 12, y: 16 * 34 },
          counters: { 'visit:aomori-field': 1 },
        },
      },
    });
    expect(
      Object.keys(disabled.game.progress.counters).filter(
        (key) => key === DEV_ALL_KEY || key.startsWith('dev:return:'),
      ),
    ).toEqual([]);
  });

  it('公開環境では保存済みdevを無効化して退避元へ戻す', async () => {
    const { world } = await content();
    const game = createNewGame({ name: 'ハル', grade: 3 }, 1_000);
    game.progress.currentMap = 'aomori-field';
    game.progress.currentArea = 'aomori';
    game.progress.currentIsland = 'tohoku';
    game.progress.position = { x: 16 * 12, y: 16 * 34 };
    const enabled = enableDeveloperTravel(game, 2_000);
    enabled.progress.currentMap = 'okinawa-field';
    enabled.progress.currentArea = 'okinawa';
    enabled.progress.currentIsland = 'kyushu-okinawa';
    enabled.progress.position = { x: 16 * 8, y: 16 * 9 };

    expect(developerTravelActive(enabled, true)).toBe(true);
    expect(developerTravelActive(enabled, false)).toBe(false);
    expect(normalizeUnavailableDeveloperTravel(enabled, world, true, 3_000)).toBe(enabled);

    const normalized = normalizeUnavailableDeveloperTravel(enabled, world, false, 3_000);
    expect(normalized.progress).toMatchObject({
      currentIsland: 'tohoku',
      currentArea: 'aomori',
      currentMap: 'aomori-field',
      position: { x: 16 * 12, y: 16 * 34 },
    });
    expect(normalized.progress.counters[DEV_ALL_KEY]).toBeUndefined();
    expect(Object.keys(normalized.progress.counters).some((key) => key.startsWith('dev:return:'))).toBe(
      false,
    );
  });

  it('Scene起動用の復旧値は公開環境だけ通常位置へ差し替える', async () => {
    const { world } = await content();
    const game = createNewGame({ name: 'ハル', grade: 3 }, 1_000);
    game.progress.position = { x: 16 * 12, y: 16 * 34 };
    const enabled = enableDeveloperTravel(game, 2_000);
    enabled.progress.currentMap = 'okinawa-field';
    enabled.progress.currentArea = 'okinawa';
    enabled.progress.currentIsland = 'kyushu-okinawa';

    expect(unavailableDeveloperSceneRecovery(enabled, world, true, 16, 3_000)).toBeNull();
    expect(unavailableDeveloperSceneRecovery(enabled, world, false, 16, 3_000)).toMatchObject({
      game: { progress: { currentMap: 'aomori-field' } },
      scene: {
        mapKey: 'aomori-field',
        spawnName: 'spawn',
        spawnTile: [12, 34],
        exactSpawn: true,
        pendingInterPrefectureArrival: false,
      },
    });
  });
});
