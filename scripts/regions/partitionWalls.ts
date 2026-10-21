export interface RegionGateSpec {
  between: [string, string];
  openedBy: string;
}

export interface PlacedRegionGate extends RegionGateSpec {
  i: number;
}

interface ApplyRegionWallsOptions {
  prefId: string;
  ids: string[];
  region: Int32Array;
  distances: Int32Array[];
  seedIndexes: number[][];
  protectedIndexes?: ReadonlySet<number>;
  width: number;
  around: (i: number) => number[];
  gates: RegionGateSpec[];
}

interface Border {
  a: number;
  b: number;
  edges: [number, number][];
}

interface WallResult {
  wall: Uint8Array;
  gates: PlacedRegionGate[];
}

/**
 * エリア境界の片側を壁にして関所を開ける。region は壁と小さな分断を -1 に更新する。
 */
export function applyRegionWalls({
  prefId,
  ids,
  region,
  distances,
  seedIndexes,
  protectedIndexes = new Set(),
  around,
  gates: gateSpecs,
}: ApplyRegionWallsOptions): PlacedRegionGate[] {
  const n = region.length;
  // さかいの 山なみ：境界のどちらか片側を壁にし、両エリアの陸続きが切れない側を選ぶ。
  // 常に番号が大きい側を壁にすると、細い半島の付け根を切って飛び地ができることがある。
  const borders = new Map<string, Border>();
  for (let i = 0; i < n; i++) {
    const r = region[i]!;
    if (r < 0) continue;
    for (const j of around(i)) {
      const other = region[j]!;
      if (other < 0 || other === r) continue;
      const a = Math.min(r, other);
      const b = Math.max(r, other);
      const key = `${a}:${b}`;
      const border = borders.get(key) ?? { a, b, edges: [] };
      if (i < j) border.edges.push(r === a ? [i, j] : [j, i]);
      borders.set(key, border);
    }
  }
  const borderList = [...borders.values()].sort((left, right) => left.a - right.a || left.b - right.b);
  const adjacentRegions = new Set(borderList.map(({ a, b }) => [ids[a]!, ids[b]!].sort().join('・')));
  for (const gate of gateSpecs)
    if (!adjacentRegions.has([...gate.between].sort().join('・')))
      throw new Error(
        `${prefId}: ${gate.between.join('・')} は となりあって いないので 関所を おけません` +
          `（隣接: ${[...adjacentRegions].sort().join(', ')}）`,
      );

  const remainsConnected = (wall: Uint8Array, r: number) => {
    let first = -1;
    let total = 0;
    for (let i = 0; i < n; i++)
      if (region[i] === r && !wall[i]) {
        if (first < 0) first = i;
        total++;
      }
    if (first < 0) return false;
    const seen = new Set([first]);
    const queue = [first];
    for (let head = 0; head < queue.length; head++)
      for (const next of around(queue[head]!))
        if (region[next] === r && !wall[next] && !seen.has(next)) {
          seen.add(next);
          queue.push(next);
        }
    return seen.size === total;
  };

  const hasPrefixLockedProgression = (wall: Uint8Array, gates: PlacedRegionGate[]): boolean => {
    const start = seedIndexes[0]?.find((i) => !wall[i]);
    if (start === undefined) return false;
    for (let defeatedCount = 0; defeatedCount <= ids.length; defeatedCount++) {
      const defeated = new Set(ids.slice(0, defeatedCount));
      const closedGates = new Set(gates.filter((gate) => !defeated.has(gate.openedBy)).map((gate) => gate.i));
      const seen = new Set([start]);
      const queue = [start];
      for (let head = 0; head < queue.length; head++)
        for (const next of around(queue[head]!))
          if (region[next]! >= 0 && !wall[next] && !closedGates.has(next) && !seen.has(next)) {
            seen.add(next);
            queue.push(next);
          }
      const reached = new Set([...seen].map((i) => region[i]!).filter((r) => r >= 0));
      const lastExpected = Math.min(defeatedCount, ids.length - 1);
      if (reached.size !== lastExpected + 1) return false;
      let exactPrefix = true;
      for (let r = 0; r <= lastExpected; r++)
        if (!reached.has(r)) {
          exactPrefix = false;
          break;
        }
      if (!exactPrefix) return false;
    }
    return true;
  };

  let wallLayoutsTried = 0;
  const finishWalls = (input: Uint8Array): WallResult | null => {
    const placeGates = (
      gateIndex: number,
      wall: Uint8Array,
      placed: PlacedRegionGate[],
      openedCells: ReadonlySet<number>,
    ): WallResult | null => {
      if (gateIndex >= gateSpecs.length) {
        wallLayoutsTried++;
        if ([...protectedIndexes].some((i) => wall[i])) return null;
        if (!ids.every((_, r) => remainsConnected(wall, r))) return null;
        return hasPrefixLockedProgression(wall, placed) ? { wall, gates: placed } : null;
      }

      const gate = gateSpecs[gateIndex]!;
      const a = ids.indexOf(gate.between[0]);
      const b = ids.indexOf(gate.between[1]);
      if (a < 0 || b < 0)
        throw new Error(`${prefId}: 関所の エリア ${gate.between.join('・')} が regions に ありません`);
      const border = borders.get(`${Math.min(a, b)}:${Math.max(a, b)}`);
      if (!border) return null;
      const candidates = border.edges
        .flatMap(([left, right]) => {
          const edge = region[left] === a ? ([left, right] as const) : ([right, left] as const);
          return edge
            .filter((i) => wall[i] && !protectedIndexes.has(i))
            .map((i) => ({ edge, i, score: distances[a]![edge[0]]! + distances[b]![edge[1]]! }));
        })
        .filter(
          ({ edge, i }) =>
            !openedCells.has(edge[0]) && !openedCells.has(edge[1]) && !placed.some((g) => g.i === i),
        )
        .sort((left, right) => left.score - right.score || left.i - right.i);

      for (const candidate of candidates) {
        const nextWall = wall.slice();
        nextWall[candidate.edge[0]] = 0;
        nextWall[candidate.edge[1]] = 0;
        const nextOpened = new Set(openedCells);
        nextOpened.add(candidate.edge[0]);
        nextOpened.add(candidate.edge[1]);
        const result = placeGates(
          gateIndex + 1,
          nextWall,
          [...placed, { i: candidate.i, between: gate.between, openedBy: gate.openedBy }],
          nextOpened,
        );
        if (result) return result;
      }
      return null;
    };

    return placeGates(0, input.slice(), [], new Set());
  };
  const chooseWallSides = (index: number, wall: Uint8Array): WallResult | null => {
    if (index >= borderList.length) return finishWalls(wall);
    const border = borderList[index]!;
    // 番号が大きい側を従来どおり先に試し、最終的に全地域がつながる場合だけ採用する。
    for (const side of [1, 0] as const) {
      const next = wall.slice();
      for (const edge of border.edges) next[edge[side]] = 1;
      const result = chooseWallSides(index + 1, next);
      if (result) return result;
    }
    return null;
  };
  const result = chooseWallSides(0, new Uint8Array(n));
  if (!result)
    throw new Error(`${prefId}: エリアを切らずに境界壁と関所を配置できません（${wallLayoutsTried}通り）`);
  const { wall, gates } = result;

  // かべの マスは エリアの 外（-1）に して、地形を 'W' に
  for (let i = 0; i < n; i++) if (wall[i]) region[i] = -1;
  return gates;
}
