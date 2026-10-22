import { useEffect, useRef } from 'preact/hooks';
import type { RoadmapNode } from '../../shared/menuModel';
import { t } from '../i18n';
import { RubyLabel } from '../RubyLabel';
import { displayText } from '../ruby';
import { playSfx } from '../sfx';

const NODE_W = 136;
const NODE_H = 118;

function marker(node: RoadmapNode): string {
  if (node.visibility !== 'revealed') return '？';
  if (node.state === 'cleared') return '★';
  if (node.state === 'review') return '↻';
  if (node.state === 'current') return '●';
  if (node.state === 'locked') return '－';
  return '○';
}

export function RoadmapGraph({
  nodes,
  onSelect,
}: {
  nodes: RoadmapNode[];
  onSelect: (unitId: string) => void;
}) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const minX = nodes.length ? Math.min(...nodes.map((node) => node.x)) : 0;
  const minY = nodes.length ? Math.min(...nodes.map((node) => node.y)) : 0;
  const offsetX = minX - 40;
  const offsetY = minY - 40;
  const position = (node: RoadmapNode) => ({ x: node.x - offsetX, y: node.y - offsetY });
  const width = Math.max(720, ...nodes.map((node) => position(node).x + NODE_W + 40));
  const height = Math.max(460, ...nodes.map((node) => position(node).y + NODE_H + 40));
  const edges = nodes.flatMap((target) =>
    target.prerequisiteIds.flatMap((sourceId) => {
      const source = byId.get(sourceId);
      return source ? [{ source, target }] : [];
    }),
  );
  const focusNode =
    nodes.find((node) => node.state === 'current') ??
    nodes.find((node) => node.visibility === 'revealed' && node.state === 'open') ??
    nodes.find((node) => node.visibility === 'revealed');

  useEffect(() => {
    const viewport = canvasRef.current?.parentElement;
    if (!viewport || !focusNode) return;
    const target = position(focusNode);
    viewport.scrollLeft = Math.max(0, target.x - viewport.clientWidth / 2 + NODE_W / 2);
    viewport.scrollTop = Math.max(0, target.y - viewport.clientHeight / 2 + NODE_H / 2);
  }, [focusNode?.id, offsetX, offsetY]);

  if (!nodes.length) return <RubyLabel text={t('field.roadmapEmpty')} />;

  return (
    <div ref={canvasRef} class="nq-roadmap-canvas" style={{ width, height }}>
      <svg class="nq-roadmap-edges" width={width} height={height} aria-hidden="true">
        {edges.map(({ source, target }) => {
          const from = position(source);
          const to = position(target);
          const x1 = from.x + NODE_W / 2;
          const y1 = from.y + 50;
          const x2 = to.x + NODE_W / 2;
          const y2 = to.y + 8;
          const bend = Math.max(32, (y2 - y1) / 2);
          const hidden = source.visibility === 'hidden' || target.visibility === 'hidden';
          const frontier = source.visibility === 'frontier' || target.visibility === 'frontier';
          return (
            <path
              key={`${source.id}->${target.id}`}
              class={`nq-roadmap-edge${hidden ? ' nq-roadmap-edge-hidden' : frontier ? ' nq-roadmap-edge-frontier' : ''}`}
              d={`M ${x1} ${y1} C ${x1} ${y1 + bend}, ${x2} ${y2 - bend}, ${x2} ${y2}`}
            />
          );
        })}
      </svg>
      {nodes.map((node) => {
        const pos = position(node);
        if (node.visibility === 'hidden')
          return (
            <div
              key={node.id}
              class="nq-roadmap-hidden"
              style={{ left: pos.x, top: pos.y }}
              aria-hidden="true"
            >
              <span>···</span>
            </div>
          );

        const fogged = node.visibility === 'frontier';
        const label = fogged ? t('field.roadmapFog') : node.name;
        return (
          <button
            key={node.id}
            type="button"
            class={`nq-roadmap-node nq-roadmap-${node.state}${fogged ? ' nq-roadmap-frontier' : ''}`}
            style={{ left: pos.x, top: pos.y }}
            aria-label={displayText(label)}
            disabled={fogged || node.state === 'locked'}
            onClick={() => {
              playSfx('select');
              onSelect(node.id);
            }}
            title={
              fogged ? displayText(label) : `${displayText(node.name)} ${Math.round(node.mastery * 100)}%`
            }
          >
            <span class="nq-roadmap-step">{marker(node)}</span>
            <RubyLabel text={label} class="nq-roadmap-node-name" />
            {!fogged && (
              <>
                <span class="nq-roadmap-node-tags">
                  <RubyLabel
                    text={t('field.roadmapGradeName', { n: node.grade })}
                    class="nq-roadmap-node-term"
                  />
                  {node.courseKind === 'supplementary' && (
                    <RubyLabel text={t('field.roadmapSupplementary')} class="nq-roadmap-node-extra" />
                  )}
                </span>
                <span
                  class="nq-roadmap-meter"
                  role="meter"
                  aria-label={`${displayText(node.name)} ${Math.round(node.mastery * 100)}%`}
                  aria-valuemin={0}
                  aria-valuenow={Math.round(node.mastery * 100)}
                  aria-valuemax={100}
                >
                  <span style={{ width: `${Math.round(node.mastery * 100)}%` }} />
                </span>
              </>
            )}
          </button>
        );
      })}
    </div>
  );
}
