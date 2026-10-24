import type { RoadmapNode } from '../../shared/menuModel';

const X_ORIGIN = 72;
const Y_ORIGIN = 64;
// ノード幅136pxに余白を足し、同じ段の長い単元名も接触させない。
const X_GAP = 152;
const Y_GAP = 128;

function stableNodeOrder(left: RoadmapNode, right: RoadmapNode): number {
  return left.grade - right.grade || left.id.localeCompare(right.id);
}

/**
 * 学習の土台を下、発展を上に置く決定論的な階層レイアウト。
 * 前提ノードの横位置を基準に並べ、分岐と合流の交差を抑える。
 */
export function layoutRoadmapNodes(nodes: RoadmapNode[]): void {
  for (const subject of new Set(nodes.map((node) => node.subject))) {
    const subjectNodes = nodes.filter((node) => node.subject === subject);
    const byId = new Map(subjectNodes.map((node) => [node.id, node]));
    const depths = new Map<string, number>();
    const visiting = new Set<string>();

    const depthOf = (node: RoadmapNode): number => {
      const known = depths.get(node.id);
      if (known !== undefined) return known;
      const gradeBase = (node.grade - 1) * 3;
      if (visiting.has(node.id)) return gradeBase;
      visiting.add(node.id);
      const prerequisiteDepths = node.prerequisiteIds
        .map((id) => byId.get(id))
        .filter((item): item is RoadmapNode => item !== undefined)
        .map((item) => depthOf(item) + 1);
      visiting.delete(node.id);
      const depth = Math.max(gradeBase, ...prerequisiteDepths);
      depths.set(node.id, depth);
      return depth;
    };

    const levels = new Map<number, RoadmapNode[]>();
    for (const node of subjectNodes) {
      const depth = depthOf(node);
      const level = levels.get(depth) ?? [];
      level.push(node);
      levels.set(depth, level);
    }

    const widest = Math.max(1, ...[...levels.values()].map((level) => level.length));
    const maxDepth = Math.max(0, ...levels.keys());
    const assignedX = new Map<string, number>();

    for (const depth of [...levels.keys()].sort((left, right) => left - right)) {
      const level = levels.get(depth) ?? [];
      const parentCenter = (node: RoadmapNode): number | undefined => {
        const positions = node.prerequisiteIds
          .map((id) => assignedX.get(id))
          .filter((position): position is number => position !== undefined);
        if (!positions.length) return undefined;
        return positions.reduce((sum, position) => sum + position, 0) / positions.length;
      };
      level.sort((left, right) => {
        const leftCenter = parentCenter(left);
        const rightCenter = parentCenter(right);
        if (leftCenter !== undefined && rightCenter !== undefined && leftCenter !== rightCenter)
          return leftCenter - rightCenter;
        if (leftCenter !== undefined && rightCenter === undefined) return -1;
        if (leftCenter === undefined && rightCenter !== undefined) return 1;
        return stableNodeOrder(left, right);
      });

      const inset = ((widest - level.length) * X_GAP) / 2;
      level.forEach((node, index) => {
        node.x = X_ORIGIN + inset + index * X_GAP;
        node.y = Y_ORIGIN + (maxDepth - depth) * Y_GAP;
        assignedX.set(node.id, node.x);
      });
    }
  }
}
