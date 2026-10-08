import type { Grade, QuestionBase, Subject } from '../questions/contracts';
import { allRenderers } from '../questions/renderers/registry';

type EditorQuestionFormProps = {
  question: QuestionBase;
  onQuestionChange: (question: QuestionBase) => void;
  onFieldChange: (field: keyof QuestionBase, value: unknown) => void;
  onPayloadChange: (key: string, value: unknown) => void;
};

export function EditorQuestionForm({
  question,
  onQuestionChange,
  onFieldChange,
  onPayloadChange,
}: EditorQuestionFormProps) {
  const rawChoices = (question.payload as Record<string, unknown>)?.choices;
  const choices = Array.isArray(rawChoices)
    ? rawChoices.filter(
        (choice): choice is { id: string; text?: string; image?: string; audio?: string } =>
          !!choice && typeof choice === 'object' && typeof (choice as { id?: unknown }).id === 'string',
      )
    : [];

  return (
    <>
      <div class="ed-group">
        <div class="ed-group-title">基本メタデータ</div>
        <div class="ed-field">
          <label class="ed-label" for="ed-question-id">
            問題 ID
          </label>
          <input
            id="ed-question-id"
            class="ed-input"
            value={question.id}
            onInput={(event) => onFieldChange('id', (event.target as HTMLInputElement).value)}
          />
        </div>
        <div class="ed-field">
          <label class="ed-label" for="ed-question-type">
            問題タイプ (type)
          </label>
          <select
            id="ed-question-type"
            class="ed-select"
            value={question.type}
            onChange={(event) => {
              const type = (event.target as HTMLSelectElement).value;
              let payload: unknown = {};
              if (type === 'choice') {
                payload = {
                  prompt: '問題文',
                  choices: [
                    { id: 'choice-1', text: '選択肢1' },
                    { id: 'choice-2', text: '選択肢2' },
                  ],
                  answer: 'choice-1',
                };
              } else if (type === 'picture-word') {
                payload = {
                  image: 'questions/eigo/apple.png',
                  words: [
                    { id: 'apple', text: 'apple' },
                    { id: 'banana', text: 'banana' },
                  ],
                  answer: 'apple',
                };
              }
              onQuestionChange({ ...question, type, payload });
            }}
          >
            {allRenderers().map((renderer) => (
              <option key={renderer.type} value={renderer.type}>
                {renderer.type}
              </option>
            ))}
          </select>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <div class="ed-field">
            <label class="ed-label" for="ed-question-subject">
              教科 (subject)
            </label>
            <select
              id="ed-question-subject"
              class="ed-select"
              value={question.subject}
              onChange={(event) =>
                onFieldChange('subject', (event.target as HTMLSelectElement).value as Subject)
              }
            >
              <option value="sansu">算数 (sansu)</option>
              <option value="kokugo">国語 (kokugo)</option>
              <option value="rika">理科 (rika)</option>
              <option value="shakai">社会 (shakai)</option>
              <option value="seikatsu">生活 (seikatsu)</option>
              <option value="eigo">英語 (eigo)</option>
            </select>
          </div>
          <div class="ed-field">
            <label class="ed-label" for="ed-question-grade">
              学年 (grade)
            </label>
            <select
              id="ed-question-grade"
              class="ed-select"
              value={question.grade}
              onChange={(event) =>
                onFieldChange('grade', Number((event.target as HTMLSelectElement).value) as Grade)
              }
            >
              {[1, 2, 3, 4, 5, 6].map((grade) => (
                <option key={grade} value={grade}>
                  小{grade}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div class="ed-field">
          <label class="ed-label" for="ed-question-unit">
            単元コード (unit)
          </label>
          <input
            id="ed-question-unit"
            class="ed-input"
            value={question.unit}
            onInput={(event) => onFieldChange('unit', (event.target as HTMLInputElement).value)}
          />
        </div>
        <div class="ed-field">
          <label class="ed-label" for="ed-question-time-limit">
            制限時間 (秒)
          </label>
          <input
            id="ed-question-time-limit"
            type="number"
            class="ed-input"
            value={question.timeLimitSec ?? 20}
            onInput={(event) =>
              onFieldChange('timeLimitSec', Number((event.target as HTMLInputElement).value))
            }
          />
        </div>
        <div class="ed-field">
          <label class="ed-label" for="ed-question-explanation">
            解説文 (RubyText)
          </label>
          <textarea
            id="ed-question-explanation"
            class="ed-textarea"
            value={question.explanation ?? ''}
            onInput={(event) => onFieldChange('explanation', (event.target as HTMLTextAreaElement).value)}
          />
        </div>
      </div>

      <div class="ed-group">
        <div class="ed-group-title">問題のコンテンツ ({question.type})</div>
        {question.type === 'choice' && (
          <>
            <div class="ed-field">
              <label class="ed-label" for="ed-question-prompt">
                問題文 (prompt)
              </label>
              <textarea
                id="ed-question-prompt"
                class="ed-textarea"
                value={((question.payload as Record<string, unknown>)?.prompt as string) ?? ''}
                onInput={(event) => onPayloadChange('prompt', (event.target as HTMLTextAreaElement).value)}
              />
            </div>
            <div class="ed-field">
              <span class="ed-label">選択肢一覧</span>
              {choices.map((choice, index) => (
                <div key={choice.id} class="ed-choice-row">
                  <input
                    type="radio"
                    name="correct"
                    aria-label={`選択肢 ${index + 1}を正解にする`}
                    class="ed-radio"
                    checked={((question.payload as Record<string, unknown>)?.answer as string) === choice.id}
                    onChange={() => onPayloadChange('answer', choice.id)}
                    title="正解の選択肢として指定"
                  />
                  <input
                    class="ed-input"
                    aria-label={`選択肢 ${index + 1}`}
                    value={choice.text ?? ''}
                    onInput={(event) => {
                      const nextChoices = [...choices];
                      nextChoices[index] = {
                        ...choice,
                        text: (event.target as HTMLInputElement).value,
                      };
                      onPayloadChange('choices', nextChoices);
                    }}
                  />
                  <button
                    type="button"
                    class="ed-btn"
                    aria-label={`選択肢 ${index + 1}を削除`}
                    onClick={() =>
                      onPayloadChange(
                        'choices',
                        choices.filter((_, choiceIndex) => choiceIndex !== index),
                      )
                    }
                  >
                    ❌
                  </button>
                </div>
              ))}
              <button
                type="button"
                class="ed-btn"
                style={{ marginTop: '6px' }}
                onClick={() => {
                  let number = choices.length + 1;
                  while (choices.some((choice) => choice.id === `choice-${number}`)) number += 1;
                  onPayloadChange('choices', [
                    ...choices,
                    { id: `choice-${number}`, text: `選択肢${number}` },
                  ]);
                }}
              >
                ➕ 選択肢を追加
              </button>
            </div>
          </>
        )}

        {question.type === 'picture-word' && (
          <>
            <div class="ed-field">
              <label class="ed-label" for="ed-question-image">
                画像パス (image)
              </label>
              <input
                id="ed-question-image"
                class="ed-input"
                value={((question.payload as Record<string, unknown>)?.image as string) ?? ''}
                onInput={(event) => onPayloadChange('image', (event.target as HTMLInputElement).value)}
              />
            </div>
            <div class="ed-field">
              <label class="ed-label" for="ed-question-answer">
                正解の単語ID (answer)
              </label>
              <input
                id="ed-question-answer"
                class="ed-input"
                value={((question.payload as Record<string, unknown>)?.answer as string) ?? ''}
                onInput={(event) => onPayloadChange('answer', (event.target as HTMLInputElement).value)}
              />
            </div>
          </>
        )}

        {question.type !== 'choice' && question.type !== 'picture-word' && (
          <div style={{ color: '#94a3b8', fontSize: '12px' }}>
            このタイプは「生JSON編集」タブからペイロードを編集できます。
          </div>
        )}
      </div>
    </>
  );
}
