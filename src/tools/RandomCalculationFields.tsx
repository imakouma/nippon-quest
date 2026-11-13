import { t } from '../ui/i18n';
import { stripRuby } from '../ui/ruby';
import {
  randomCalculationSchema,
  type RandomCalculationPayload,
} from '../questions/renderers/random-calculation/schema';

export const randomCalculationText = (key: string) =>
  stripRuby(t(`tools.playground.randomCalculation.${key}`), 'kanji');

export function RandomCalculationFields({
  payload,
  onChange,
}: {
  payload: unknown;
  onChange: (key: string, value: unknown) => void;
}) {
  const rule = (payload ?? {}) as Partial<RandomCalculationPayload>;
  return (
    <>
      <p class="ed-empty">{randomCalculationText('hint')}</p>
      <div class="ed-field">
        <label class="ed-label" for="ed-random-title">
          {randomCalculationText('ruleTitle')}
        </label>
        <input
          id="ed-random-title"
          class="ed-input"
          value={rule.prompt ?? ''}
          onInput={(e) => onChange('prompt', e.currentTarget.value)}
        />
      </div>
      <div class="ed-metadata-row">
        {(['leftMin', 'leftMax', 'rightMin', 'rightMax'] as const).map((key) => (
          <div class="ed-field" key={key}>
            <label class="ed-label" for={`ed-random-${key}`}>
              {randomCalculationText(key)}
            </label>
            <input
              id={`ed-random-${key}`}
              class="ed-input"
              type="number"
              min="0"
              max="9"
              step="1"
              value={rule[key] ?? ''}
              onInput={(e) => onChange(key, e.currentTarget.valueAsNumber)}
            />
          </div>
        ))}
      </div>
      <div class="ed-field">
        <label class="ed-label" for="ed-random-carry">
          {randomCalculationText('carry')}
        </label>
        <select
          id="ed-random-carry"
          class="ed-select"
          value={String(rule.carry)}
          onChange={(e) => onChange('carry', e.currentTarget.value === 'true')}
        >
          <option value="false">{randomCalculationText('carryNo')}</option>
          <option value="true">{randomCalculationText('carryYes')}</option>
        </select>
      </div>
      <div class="ed-field">
        <label class="ed-label" for="ed-random-response">
          {randomCalculationText('response')}
        </label>
        <select
          id="ed-random-response"
          class="ed-select"
          value={rule.response}
          onChange={(e) => onChange('response', e.currentTarget.value)}
        >
          <option value="text-input">{randomCalculationText('input')}</option>
          <option value="choice">{randomCalculationText('choice')}</option>
        </select>
      </div>
      {!randomCalculationSchema.safeParse(payload).success && (
        <p role="alert">{randomCalculationText('invalid')}</p>
      )}
    </>
  );
}
