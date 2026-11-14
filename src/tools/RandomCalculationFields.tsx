import type { QuestionBase } from '../questions/contracts';
import { stages, stageDefaults, type Operation } from '../questions/renderers/random-calculation/rules';
import { calculationProblem, operationsForQuestion } from '../questions/renderers/random-calculation/schema';
import { t } from '../ui/i18n';
import { stripRuby } from '../ui/ruby';
import { type RandomCalculationPayload } from '../questions/renderers/random-calculation/schema';

export const randomCalculationText = (key: string) =>
  stripRuby(t(`tools.playground.randomCalculation.${key}`), 'kanji');

export function RandomCalculationFields({
  question,
  onQuestionChange,
  onChange,
}: {
  question: QuestionBase;
  onQuestionChange: (question: QuestionBase) => void;
  onChange: (key: string, value: unknown) => void;
}) {
  const payload = question.payload;
  const rule = (payload ?? {}) as Partial<RandomCalculationPayload>;
  const available = stages.filter(
    (s) => s.grade <= question.grade && s.operations.includes(rule.operation ?? 'add'),
  );
  const stage = available.find((s) => s.id === (rule.stage ?? 'digit'));
  const change = (id: string, operation: Operation) =>
    onQuestionChange({
      ...question,
      payload: { ...stageDefaults(id, operation), prompt: rule.prompt, response: rule.response },
    });
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
      <div class="ed-field">
        <label for="ed-random-operation">{randomCalculationText('operation')}</label>
        <select
          id="ed-random-operation"
          class="ed-select"
          value={rule.operation}
          onChange={(e) => {
            const op = e.currentTarget.value as Operation;
            change(stages.find((s) => s.grade <= question.grade && s.operations.includes(op))!.id, op);
          }}
        >
          {operationsForQuestion(question).map((op) => (
            <option value={op}>{randomCalculationText(op)}</option>
          ))}
        </select>
      </div>
      <div class="ed-field">
        <label for="ed-random-stage">{randomCalculationText('stage')}</label>
        <select
          id="ed-random-stage"
          class="ed-select"
          value={rule.stage ?? 'digit'}
          onChange={(e) => change(e.currentTarget.value, rule.operation!)}
        >
          {available.map((s) => (
            <option value={s.id}>{randomCalculationText(s.id)}</option>
          ))}
        </select>
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
              min={key.startsWith('right') && rule.operation === 'divide' ? 1 : 0}
              max={
                key.startsWith('left')
                  ? rule.operation === 'add' && stage?.id === 'digit'
                    ? 9
                    : stage?.leftMax
                  : stage?.rightMax
              }
              step="1"
              value={rule[key] ?? ''}
              onInput={(e) => onChange(key, e.currentTarget.valueAsNumber)}
            />
          </div>
        ))}
      </div>
      {(rule.operation === 'add' || rule.operation === 'subtract') && (
        <div class="ed-field">
          <label class="ed-label" for="ed-random-carry">
            {randomCalculationText(rule.operation === 'subtract' ? 'borrow' : 'carry')}
          </label>
          <select
            id="ed-random-carry"
            class="ed-select"
            value={String(rule.carry)}
            onChange={(e) => onChange('carry', e.currentTarget.value === 'true')}
          >
            <option value="false">{randomCalculationText('no')}</option>
            <option value="true">{randomCalculationText('yes')}</option>
          </select>
        </div>
      )}
      {rule.operation === 'divide' && (
        <div class="ed-field">
          <label for="ed-random-remainder">{randomCalculationText('remainder')}</label>
          <select
            id="ed-random-remainder"
            class="ed-select"
            value={String(rule.remainder ?? false)}
            disabled={rule.stage === 'divisionTens'}
            onChange={(e) => onChange('remainder', e.currentTarget.value === 'true')}
          >
            <option value="false">{randomCalculationText('no')}</option>
            <option value="true">{randomCalculationText('yes')}</option>
          </select>
        </div>
      )}
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
      {calculationProblem(question) && <p role="alert">{randomCalculationText('invalid')}</p>}
    </>
  );
}
