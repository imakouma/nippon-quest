import type { LegacyAreaEvent } from '../content/schemas';
import type { RubyText } from '../../questions/contracts';
import type { EventDialogueLine, FieldEventCommand } from './contracts';

export interface LegacyAreaEventMessages {
  ask: RubyText;
  choices: readonly [RubyText, RubyText];
  later: RubyText;
}

const CHALLENGE_KEY = 'challenge';
const SCORE_KEY = 'score';

export function legacyAreaEventCommands(
  event: LegacyAreaEvent,
  messages: LegacyAreaEventMessages,
): FieldEventCommand[] {
  const speaker = event.dialogue[event.dialogue.length - 1]?.speaker;
  const later: EventDialogueLine = { speaker, text: messages.later };
  const success: FieldEventCommand[] = [
    { type: 'question', key: SCORE_KEY, request: event.question },
    { type: 'reward', scoreKey: SCORE_KEY, table: event.rewardByScore },
    { type: 'set-flag', flag: event.id },
  ];
  if (event.afterDialogue?.length) success.push({ type: 'dialogue', lines: event.afterDialogue });

  return [
    { type: 'dialogue', lines: event.dialogue },
    {
      type: 'choice',
      key: CHALLENGE_KEY,
      lines: [{ speaker, text: messages.ask }],
      choices: messages.choices,
    },
    {
      type: 'branch',
      condition: { type: 'choice', key: CHALLENGE_KEY, equals: 0 },
      then: success,
      else: [{ type: 'dialogue', lines: [later] }],
    },
  ];
}
