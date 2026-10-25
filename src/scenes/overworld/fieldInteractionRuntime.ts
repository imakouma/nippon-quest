import type { EventRuntimePorts } from '../../core/events/contracts';
import { executeEventCommands } from '../../core/events/runtime';
import type { FieldFlowRuntime } from './fieldFlowRuntime';
import type { FieldInteractionCandidate, FieldInteractionDecision } from './fieldInteractionRouter';
import { runMapTransition, type MapTransitionPorts } from './mapTransitionPipeline';

export interface FieldInteractionExecutionPorts {
  flow: FieldFlowRuntime;
  mapTransition: MapTransitionPorts;
  eventCommands?: { ports: EventRuntimePorts; flags?: ReadonlySet<string> };
  beforeMapTransition?(candidate: Extract<FieldInteractionCandidate, { kind: 'map-transition' }>): void;
  dispatch(candidate: FieldInteractionCandidate): void | Promise<void>;
}

/** Resolverの一件のdecisionを既存runtime境界へ委譲する。優先順位はここで再判定しない。 */
export async function executeFieldInteractionDecision(
  decision: FieldInteractionDecision,
  ports: FieldInteractionExecutionPorts,
): Promise<boolean> {
  if (decision.kind === 'none') return false;
  const { candidate } = decision;
  if (candidate.kind === 'map-transition') {
    ports.beforeMapTransition?.(candidate);
    await ports.flow.run('map-transition', ({ signal }) =>
      runMapTransition(candidate.request, ports.mapTransition, signal),
    );
    return true;
  }
  if (candidate.kind === 'event-command') {
    if (!ports.eventCommands) throw new Error('event-command interaction requires event runtime ports');
    await ports.flow.run('event-command', ({ signal }) =>
      executeEventCommands(candidate.commands, ports.eventCommands!.ports, {
        signal,
        flags: candidate.flags ?? ports.eventCommands!.flags,
      }),
    );
    return true;
  }
  await ports.dispatch(candidate);
  return true;
}
