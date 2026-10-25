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
    const result = await ports.flow.run('map-transition', async ({ signal }) => {
      ports.beforeMapTransition?.(candidate);
      await runMapTransition(candidate.request, ports.mapTransition, signal);
      return true;
    });
    return result === true;
  }
  if (candidate.kind === 'event-command') {
    const eventCommands = ports.eventCommands;
    if (!eventCommands) throw new Error('event-command interaction requires event runtime ports');
    const result = await ports.flow.run('event-command', ({ signal }) =>
      executeEventCommands(candidate.commands, eventCommands.ports, {
        signal,
        flags: candidate.flags ?? eventCommands.flags,
      }),
    );
    return result !== undefined;
  }
  await ports.dispatch(candidate);
  return true;
}
