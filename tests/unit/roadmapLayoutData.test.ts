import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { unitSchema } from '../../src/core/content/schemas';
import { curriculumGraph } from '../../src/core/learning';
import { buildRoadmapNodes } from '../../src/scenes/overworld/roadmap';

const NODE_WIDTH = 136;
const NODE_HEIGHT = 118;
const units = unitSchema
  .array()
  .parse(JSON.parse(readFileSync(resolve(import.meta.dirname, '../../content/units.json'), 'utf8')));

describe('実カリキュラムのロードマップ配置', () => {
  it('各教科の全表示ノードが同じ場所で重ならない', () => {
    const nodes = buildRoadmapNodes({
      units,
      curriculum: curriculumGraph,
      mastery: {},
      playerGrade: 6,
      challengeHigher: false,
      subjectLabel: (subject) => subject,
    });

    for (const subject of new Set(nodes.map((node) => node.subject))) {
      const subjectNodes = nodes.filter((node) => node.subject === subject);
      for (let leftIndex = 0; leftIndex < subjectNodes.length; leftIndex++) {
        for (let rightIndex = leftIndex + 1; rightIndex < subjectNodes.length; rightIndex++) {
          const left = subjectNodes[leftIndex]!;
          const right = subjectNodes[rightIndex]!;
          const overlaps =
            Math.abs(left.x - right.x) < NODE_WIDTH && Math.abs(left.y - right.y) < NODE_HEIGHT;
          expect(overlaps, `${subject}: ${left.id} と ${right.id} が重なっています`).toBe(false);
        }
      }
    }
  });
});
