interface ConnectedRegionPartitionOptions {
  prefId: string;
  cellCount: number;
  walkable: (i: number) => boolean;
  around: (i: number) => number[];
  anchors: number[][];
  requiredAdjacencies?: [number, number][];
}

function* permutations(values: number[]): Generator<number[]> {
  if (values.length <= 1) {
    yield values;
    return;
  }
  for (const [index, value] of values.entries())
    for (const tail of permutations([...values.slice(0, index), ...values.slice(index + 1)]))
      yield [value, ...tail];
}

function connectAnchors(
  cellCount: number,
  walkable: (i: number) => boolean,
  around: (i: number) => number[],
  anchors: number[],
  blocked: ReadonlySet<number>,
): Set<number> | null {
  const tree = new Set([anchors[0]!]);
  const remaining = new Set(anchors.slice(1));

  while (remaining.size) {
    const parent = new Int32Array(cellCount).fill(-2);
    const queue = [...tree].sort((a, b) => a - b);
    for (const i of queue) parent[i] = -1;
    let target = -1;
    for (let head = 0; head < queue.length && target < 0; head++) {
      const current = queue[head]!;
      if (remaining.has(current)) {
        target = current;
        break;
      }
      for (const next of around(current)) {
        if (!walkable(next) || blocked.has(next) || parent[next] !== -2) continue;
        parent[next] = current;
        queue.push(next);
      }
    }
    if (target < 0) return null;
    remaining.delete(target);
    for (let current = target; current >= 0 && !tree.has(current); current = parent[current]!)
      tree.add(current);
  }

  return tree;
}

/**
 * 各地域の hard anchor を必ず含む、4近傍で連結した領域を作る。
 *
 * 先に同じ地域の anchor を細い連結路で結び、互いに重ならない連結した核を作る。
 * その核から全地域を同時に1マスずつ成長させるため、後から飛び地が生まれない。
 */
export function partitionConnectedRegions({
  prefId,
  cellCount,
  walkable,
  around,
  anchors,
  requiredAdjacencies = [],
}: ConnectedRegionPartitionOptions): Int32Array {
  const owner = new Int32Array(cellCount).fill(-1);
  for (const [regionIndex, indexes] of anchors.entries()) {
    if (!indexes.length) throw new Error(`${prefId}: エリア ${regionIndex} に hard anchor がありません`);
    for (const index of indexes) {
      if (!walkable(index)) throw new Error(`${prefId}: hard anchor ${index} が歩ける本土にありません`);
      if (owner[index]! >= 0 && owner[index] !== regionIndex)
        throw new Error(`${prefId}: hard anchor ${index} を複数の地域が共有しています`);
      owner[index] = regionIndex;
    }
  }

  const allAnchors = anchors.map((indexes) => [...new Set(indexes)]);
  for (const order of permutations(anchors.map((_, index) => index))) {
    const candidate = anchors.map(() => new Set<number>());
    const reserved = new Set<number>();
    let possible = true;
    for (const regionIndex of order) {
      const foreignAnchors = new Set(
        allAnchors.flatMap((indexes, index) => (index === regionIndex ? [] : indexes)),
      );
      const blocked = new Set([...reserved, ...foreignAnchors]);
      const backbone = connectAnchors(cellCount, walkable, around, allAnchors[regionIndex]!, blocked);
      if (!backbone) {
        possible = false;
        break;
      }
      candidate[regionIndex] = backbone;
      for (const i of backbone) reserved.add(i);
    }
    if (!possible) continue;

    const region = new Int32Array(cellCount).fill(-1);
    const queue: number[] = [];
    for (const [regionIndex, backbone] of candidate.entries())
      for (const i of [...backbone].sort((a, b) => a - b)) {
        region[i] = regionIndex;
        queue.push(i);
      }

    // それぞれのマスは、同じ地域として確定した親マスからだけ追加される。
    // したがって、核が連結なら成長後の地域も常に連結したままになる。
    for (let head = 0; head < queue.length; head++) {
      const current = queue[head]!;
      for (const next of around(current)) {
        if (!walkable(next) || region[next]! >= 0) continue;
        region[next] = region[current]!;
        queue.push(next);
      }
    }

    const adjacent = new Set<string>();
    for (let i = 0; i < cellCount; i++)
      if (region[i]! >= 0)
        for (const next of around(i))
          if (region[next]! >= 0 && region[next] !== region[i])
            adjacent.add([region[i]!, region[next]!].sort((a, b) => a - b).join(':'));
    if (
      requiredAdjacencies.every(([a, b]) =>
        adjacent.has([a, b].sort((left, right) => left - right).join(':')),
      )
    )
      return region;
  }

  throw new Error(`${prefId}: hard anchor と関所の隣接を保つ連結地域へ分けられません`);
}
