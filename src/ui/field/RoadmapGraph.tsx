import { useEffect, useRef, useState } from 'preact/hooks';
import type { RoadmapNode } from '../../shared/menuModel';
import { t } from '../i18n';
import { RubyLabel } from '../RubyLabel';
import { displayText } from '../ruby';
import { playSfx } from '../sfx';

const NODE_W = 136;
const NODE_H = 118;
const MIN_ZOOM = 0.2;
const MAX_ZOOM = 1.6;
const ZOOM_STEP = 0.2;

type Point = { x: number; y: number };

function marker(node: RoadmapNode): string {
  if (node.visibility !== 'revealed') return '？';
  if (node.state === 'cleared') return '★';
  if (node.state === 'review') return '↻';
  if (node.state === 'current') return '●';
  if (node.state === 'locked') return '－';
  return '○';
}

const clampZoom = (value: number) => Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, value));

function questState(node: RoadmapNode): string {
  if (node.state === 'current') return t('field.roadmapQuestCurrent');
  if (node.state === 'review') return t('field.roadmapQuestReview');
  if (node.state === 'cleared') return t('field.roadmapQuestCleared');
  return t('field.roadmapQuestOpen');
}

export function RoadmapGraph({
  nodes,
  onSelect,
}: {
  nodes: RoadmapNode[];
  onSelect: (unitId: string) => void;
}) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const focusRef = useRef<HTMLButtonElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState<Point>({ x: 0, y: 0 });
  const view = useRef({ zoom, pan });
  view.current = { zoom, pan };
  const drag = useRef({ pointerId: -1, x: 0, y: 0, panX: 0, panY: 0, moved: false });
  const gesture = useRef({
    pointers: new Map<number, Point>(),
    distance: 0,
    zoom: 1,
    worldX: 0,
    worldY: 0,
  });

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
  const selectableFocusNode =
    focusNode?.visibility === 'revealed' && focusNode.state !== 'locked'
      ? focusNode
      : nodes.find((node) => node.visibility === 'revealed' && node.state !== 'locked');
  const [selectedId, setSelectedId] = useState(selectableFocusNode?.id ?? '');
  const selectedNode =
    nodes.find(
      (node) => node.id === selectedId && node.visibility === 'revealed' && node.state !== 'locked',
    ) ?? selectableFocusNode;

  const clampPan = (next: Point, atZoom: number): Point => {
    const viewport = viewportRef.current;
    if (!viewport?.clientWidth || !viewport.clientHeight) return next;
    const scaledWidth = width * atZoom;
    const scaledHeight = height * atZoom;
    const clampAxis = (value: number, viewportSize: number, canvasSize: number) =>
      Math.max(viewportSize / 2 - canvasSize, Math.min(viewportSize / 2, value));
    return {
      x: clampAxis(next.x, viewport.clientWidth, scaledWidth),
      y: clampAxis(next.y, viewport.clientHeight, scaledHeight),
    };
  };

  const updateView = (nextZoom: number, nextPan: Point) => {
    const clampedPan = clampPan(nextPan, nextZoom);
    view.current = { zoom: nextZoom, pan: clampedPan };
    setZoom(nextZoom);
    setPan(clampedPan);
  };

  const centerOnFocus = (nextZoom: number) => {
    const viewport = viewportRef.current;
    if (!viewport || !focusNode) return;
    const target = position(focusNode);
    const focusWidth = focusRef.current?.offsetWidth || NODE_W;
    const focusHeight = focusRef.current?.offsetHeight || NODE_H;
    updateView(nextZoom, {
      x: viewport.clientWidth / 2 - (target.x + focusWidth / 2) * nextZoom,
      y: viewport.clientHeight / 2 - (target.y + focusHeight / 2) * nextZoom,
    });
  };

  useEffect(() => {
    centerOnFocus(1);
  }, [focusNode?.id, offsetX, offsetY, width, height]);

  useEffect(() => {
    if (selectedNode?.id !== selectedId) setSelectedId(selectedNode?.id ?? '');
  }, [selectedId, selectedNode?.id]);

  if (!nodes.length) return <RubyLabel text={t('field.roadmapEmpty')} />;

  const localPoint = (element: HTMLElement, clientX: number, clientY: number): Point => {
    const box = element.getBoundingClientRect();
    const scaleX = box.width ? element.clientWidth / box.width : 1;
    const scaleY = box.height ? element.clientHeight / box.height : 1;
    return {
      x: (clientX - box.left) * scaleX,
      y: (clientY - box.top) * scaleY,
    };
  };

  const zoomAt = (next: number, point: Point) => {
    const current = view.current;
    const level = clampZoom(next);
    if (Math.abs(level - current.zoom) < 0.001) return;
    const worldX = (point.x - current.pan.x) / current.zoom;
    const worldY = (point.y - current.pan.y) / current.zoom;
    updateView(level, {
      x: point.x - worldX * level,
      y: point.y - worldY * level,
    });
  };

  const changeZoom = (amount: number) => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    playSfx('move');
    zoomAt(view.current.zoom + amount, {
      x: viewport.clientWidth / 2,
      y: viewport.clientHeight / 2,
    });
  };

  const resetView = () => {
    playSfx('move');
    centerOnFocus(1);
  };

  const onPointerDown = (event: PointerEvent) => {
    if (event.button !== 0) return;
    const viewport = event.currentTarget as HTMLElement;
    const points = gesture.current.pointers;
    points.set(event.pointerId, { x: event.clientX, y: event.clientY });
    drag.current.moved = false;
    if (points.size === 2) {
      const [a, b] = [...points.values()];
      if (!a || !b) return;
      const center = localPoint(viewport, (a.x + b.x) / 2, (a.y + b.y) / 2);
      gesture.current.distance = Math.hypot(a.x - b.x, a.y - b.y);
      gesture.current.zoom = view.current.zoom;
      gesture.current.worldX = (center.x - view.current.pan.x) / view.current.zoom;
      gesture.current.worldY = (center.y - view.current.pan.y) / view.current.zoom;
      for (const pointerId of points.keys()) viewport.setPointerCapture?.(pointerId);
      drag.current.moved = true;
      return;
    }
    drag.current = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      panX: view.current.pan.x,
      panY: view.current.pan.y,
      moved: false,
    };
  };

  const onPointerMove = (event: PointerEvent) => {
    const points = gesture.current.pointers;
    if (!points.has(event.pointerId)) return;
    points.set(event.pointerId, { x: event.clientX, y: event.clientY });
    const viewport = event.currentTarget as HTMLElement;
    if (points.size >= 2) {
      const [a, b] = [...points.values()];
      if (!a || !b || gesture.current.distance <= 0) return;
      const center = localPoint(viewport, (a.x + b.x) / 2, (a.y + b.y) / 2);
      const level = clampZoom(
        gesture.current.zoom * (Math.hypot(a.x - b.x, a.y - b.y) / gesture.current.distance),
      );
      updateView(level, {
        x: center.x - gesture.current.worldX * level,
        y: center.y - gesture.current.worldY * level,
      });
      drag.current.moved = true;
      return;
    }
    const start = drag.current;
    if (start.pointerId !== event.pointerId) return;
    const box = viewport.getBoundingClientRect();
    const scaleX = box.width ? viewport.clientWidth / box.width : 1;
    const scaleY = box.height ? viewport.clientHeight / box.height : 1;
    const dx = (event.clientX - start.x) * scaleX;
    const dy = (event.clientY - start.y) * scaleY;
    if (!start.moved && Math.abs(dx) + Math.abs(dy) > 4) {
      start.moved = true;
      viewport.setPointerCapture?.(event.pointerId);
    }
    updateView(view.current.zoom, { x: start.panX + dx, y: start.panY + dy });
  };

  const onPointerUp = (event: PointerEvent) => {
    const points = gesture.current.pointers;
    points.delete(event.pointerId);
    if (points.size === 1) {
      const [pointerId, point] = [...points.entries()][0] ?? [];
      if (pointerId !== undefined && point) {
        drag.current = {
          pointerId,
          x: point.x,
          y: point.y,
          panX: view.current.pan.x,
          panY: view.current.pan.y,
          moved: true,
        };
      }
      return;
    }
    if (drag.current.pointerId === event.pointerId || points.size === 0) drag.current.pointerId = -1;
  };

  const onWheel = (event: WheelEvent) => {
    event.preventDefault();
    const viewport = event.currentTarget as HTMLElement;
    const box = viewport.getBoundingClientRect();
    const scaleX = box.width ? viewport.clientWidth / box.width : 1;
    const scaleY = box.height ? viewport.clientHeight / box.height : 1;
    if (event.ctrlKey || event.metaKey) {
      zoomAt(view.current.zoom - event.deltaY * 0.005, {
        x: (event.clientX - box.left) * scaleX,
        y: (event.clientY - box.top) * scaleY,
      });
      return;
    }
    updateView(view.current.zoom, {
      x: view.current.pan.x - event.deltaX * scaleX,
      y: view.current.pan.y - event.deltaY * scaleY,
    });
  };

  return (
    <div class="nq-roadmap-map-shell" data-zoom-detail={zoom < 0.5 ? 'overview' : 'detail'}>
      <div class="nq-roadmap-map-tools" role="group" aria-label={displayText(t('field.roadmapZoomTools'))}>
        <button
          type="button"
          class="nq-roadmap-map-button nq-roadmap-zoom-out"
          aria-label={displayText(t('field.roadmapZoomOut'))}
          disabled={zoom <= MIN_ZOOM + 0.001}
          onClick={() => changeZoom(-ZOOM_STEP)}
        >
          −
        </button>
        <span class="nq-roadmap-zoom-value" aria-live="polite">
          {Math.round(zoom * 100)}%
        </span>
        <button
          type="button"
          class="nq-roadmap-map-button nq-roadmap-zoom-in"
          aria-label={displayText(t('field.roadmapZoomIn'))}
          disabled={zoom >= MAX_ZOOM - 0.001}
          onClick={() => changeZoom(ZOOM_STEP)}
        >
          ＋
        </button>
        <button type="button" class="nq-roadmap-map-button nq-roadmap-reset" onClick={resetView}>
          <RubyLabel text={t('field.roadmapCenter')} />
        </button>
      </div>
      <div
        ref={viewportRef}
        class="nq-roadmap-map"
        role="region"
        aria-label={displayText(t('field.roadmapMapAria'))}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onWheel={onWheel}
        onClickCapture={(event) => {
          if (!drag.current.moved || event.detail === 0) return;
          event.preventDefault();
          event.stopPropagation();
          drag.current.moved = false;
        }}
      >
        <div
          class="nq-roadmap-canvas"
          style={{ width, height, transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}
        >
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
              const active = source.id === selectedNode?.id || target.id === selectedNode?.id;
              return (
                <path
                  key={`${source.id}->${target.id}`}
                  class={`nq-roadmap-edge${hidden ? ' nq-roadmap-edge-hidden' : frontier ? ' nq-roadmap-edge-frontier' : ''}${active ? ' nq-roadmap-edge-active' : ''}`}
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
            const selected = node.id === selectedNode?.id;
            return (
              <button
                key={node.id}
                ref={node.id === focusNode?.id ? focusRef : undefined}
                type="button"
                class={`nq-roadmap-node nq-roadmap-${node.state}${fogged ? ' nq-roadmap-frontier' : ''}${selected ? ' nq-roadmap-selected' : ''}`}
                style={{ left: pos.x, top: pos.y }}
                aria-label={displayText(label)}
                aria-current={node.state === 'current' ? 'step' : undefined}
                aria-pressed={fogged || node.state === 'locked' ? undefined : selected}
                disabled={fogged || node.state === 'locked'}
                onClick={() => {
                  playSfx('select');
                  setSelectedId(node.id);
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
      </div>
      {selectedNode && (
        <aside
          class={`nq-roadmap-selection nq-roadmap-selection-${selectedNode.state}`}
          aria-label={displayText(t('field.roadmapSelection'))}
        >
          <span class="nq-roadmap-selection-marker" aria-hidden="true">
            {marker(selectedNode)}
          </span>
          <span class="nq-roadmap-selection-copy">
            <RubyLabel text={questState(selectedNode)} class="nq-roadmap-selection-state" />
            <RubyLabel text={selectedNode.name} class="nq-roadmap-selection-name" />
            <span class="nq-roadmap-selection-meta">
              <RubyLabel text={t('field.roadmapGradeName', { n: selectedNode.grade })} />
              <RubyLabel
                text={t('field.roadmapQuestMastery', {
                  percent: Math.round(selectedNode.mastery * 100),
                })}
              />
            </span>
          </span>
          <button
            type="button"
            class="nq-roadmap-practice"
            onClick={() => {
              playSfx('select');
              onSelect(selectedNode.id);
            }}
          >
            <RubyLabel text={t('field.roadmapQuestStart')} />
            <span aria-hidden="true"> ▶</span>
          </button>
        </aside>
      )}
    </div>
  );
}
