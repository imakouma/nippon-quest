import type { Grade, QuestionBase, Subject } from '../questions/contracts';
import { useRef } from 'preact/hooks';

type EditorQuestionFormProps = {
  question: QuestionBase;
  onQuestionChange: (question: QuestionBase) => void;
  onFieldChange: (field: keyof QuestionBase, value: unknown) => void;
  onPayloadChange: (key: string, value: unknown) => void;
};

type PayloadPath = (string | number)[];

const payloadLabels: Record<string, string> = {
  prompt: '問題文',
  answer: '正解',
  text: '文字',
  image: '画像パス',
  audio: '音声パス',
  id: 'ID',
};

function payloadLeaves(value: unknown, path: PayloadPath = []): { path: PayloadPath; value: unknown }[] {
  if (Array.isArray(value)) return value.flatMap((item, index) => payloadLeaves(item, [...path, index]));
  if (value && typeof value === 'object') {
    return Object.entries(value).flatMap(([key, item]) => payloadLeaves(item, [...path, key]));
  }
  return [{ path, value }];
}

function replacePayloadValue(value: unknown, [key, ...rest]: PayloadPath, next: unknown): unknown {
  if (key === undefined) return next;
  if (Array.isArray(value)) {
    const copy = [...value];
    copy[Number(key)] = replacePayloadValue(copy[Number(key)], rest, next);
    return copy;
  }
  const object = value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
  return { ...object, [key]: replacePayloadValue(object[String(key)], rest, next) };
}

function PayloadFields({
  question,
  onQuestionChange,
}: Pick<EditorQuestionFormProps, 'question' | 'onQuestionChange'>) {
  const leaves = payloadLeaves(question.payload);
  if (!leaves.length) return <p class="ed-empty">編集できる項目がありません。</p>;

  return (
    <>
      {leaves.map(({ path, value }) => {
        const name = String(path.at(-1) ?? 'value');
        const label = payloadLabels[name] ?? name;
        const id = `ed-payload-${path.join('-')}`;
        const update = (next: unknown) =>
          onQuestionChange({
            ...question,
            payload: replacePayloadValue(question.payload, path, next),
          });
        return (
          <div class="ed-field" key={path.join('.')}>
            <label class="ed-label" for={id}>
              {label}
              <small>{path.join('.')}</small>
            </label>
            {typeof value === 'boolean' ? (
              <input
                id={id}
                type="checkbox"
                checked={value}
                onChange={(event) => update((event.target as HTMLInputElement).checked)}
              />
            ) : (
              <input
                id={id}
                class="ed-input"
                type={typeof value === 'number' ? 'number' : 'text'}
                value={value == null ? '' : String(value)}
                onInput={(event) => {
                  const input = event.target as HTMLInputElement;
                  update(typeof value === 'number' ? Number(input.value) : input.value);
                }}
              />
            )}
          </div>
        );
      })}
    </>
  );
}

export function EditorQuestionForm({
  question,
  onQuestionChange,
  onFieldChange,
  onPayloadChange,
}: EditorQuestionFormProps) {
  const draggedChoice = useRef<string | null>(null);
  const rawChoices = (question.payload as Record<string, unknown>)?.choices;
  const choices = Array.isArray(rawChoices)
    ? rawChoices.filter(
        (choice): choice is { id: string; text?: string; image?: string; audio?: string } =>
          !!choice && typeof choice === 'object' && typeof (choice as { id?: unknown }).id === 'string',
      )
    : [];
  const canChangeType = question.type === 'choice' || question.type === 'text-input';

  const moveChoice = (id: string, target: number) => {
    const from = choices.findIndex((choice) => choice.id === id);
    if (from < 0 || target < 0 || target >= choices.length || from === target) return;
    const next = [...choices];
    next.splice(target, 0, next.splice(from, 1)[0]!);
    onPayloadChange('choices', next);
  };

  const changeType = (type: string) => {
    if (type === question.type || !canChangeType) return;
    if (
      !window.confirm(
        '問題文と正解を引き継ぎますが、それ以外の内容は引き継がれない場合があります。変更しますか？',
      )
    )
      return;
    const payload = question.payload as Record<string, unknown>;
    const prompt = typeof payload.prompt === 'string' ? payload.prompt : '';
    const image = typeof payload.promptImage === 'string' ? { promptImage: payload.promptImage } : {};
    if (type === 'text-input') {
      const answer = choices.find((choice) => choice.id === payload.answer)?.text ?? '';
      onQuestionChange({ ...question, type, payload: { prompt, ...image, answers: [answer] } });
    } else if (type === 'choice') {
      const answer =
        Array.isArray(payload.answers) && typeof payload.answers[0] === 'string' ? payload.answers[0] : '';
      onQuestionChange({
        ...question,
        type,
        payload: {
          prompt,
          ...image,
          choices: [
            { id: 'a', text: answer },
            { id: 'b', text: '' },
          ],
          answer: 'a',
        },
      });
    }
  };

  return (
    <>
      <div class="ed-group">
        <div class="ed-group-title">問題のコンテンツ</div>
        {question.type === 'choice' && (
          <>
            <div class="ed-field">
              <label class="ed-label" for="ed-question-prompt">
                問題文
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
                <div
                  key={choice.id}
                  class="ed-choice-row"
                  onDragOver={(event) => {
                    if (draggedChoice.current) event.preventDefault();
                  }}
                  onDrop={(event) => {
                    event.preventDefault();
                    if (draggedChoice.current) moveChoice(draggedChoice.current, index);
                    draggedChoice.current = null;
                  }}
                >
                  <span
                    class="ed-drag-handle"
                    draggable
                    aria-label={`選択肢 ${index + 1}をドラッグして並べ替え`}
                    title="ドラッグして並べ替え"
                    onDragStart={(event) => {
                      draggedChoice.current = choice.id;
                      event.dataTransfer?.setData('text/plain', choice.id);
                    }}
                    onDragEnd={() => {
                      draggedChoice.current = null;
                    }}
                  >
                    ⠿
                  </span>
                  <input
                    type="radio"
                    name="correct"
                    aria-label={`選択肢 ${index + 1}を正解にする`}
                    class="ed-radio"
                    checked={((question.payload as Record<string, unknown>)?.answer as string) === choice.id}
                    onChange={() => onPayloadChange('answer', choice.id)}
                    title="正解の選択肢として指定"
                  />
                  <div class="ed-choice-move">
                    <button
                      type="button"
                      aria-label={`選択肢 ${index + 1}を上に移動`}
                      disabled={index === 0}
                      onClick={() => moveChoice(choice.id, index - 1)}
                    >
                      ▲
                    </button>
                    <button
                      type="button"
                      aria-label={`選択肢 ${index + 1}を下に移動`}
                      disabled={index === choices.length - 1}
                      onClick={() => moveChoice(choice.id, index + 1)}
                    >
                      ▼
                    </button>
                  </div>
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

        {question.type !== 'choice' && (
          <PayloadFields question={question} onQuestionChange={onQuestionChange} />
        )}
      </div>

      <div class="ed-group">
        <div class="ed-group-title">基本メタデータ</div>
        <div class="ed-identifiers">
          <div class="ed-field">
            <label class="ed-label" for="ed-question-id">
              問題 ID
            </label>
            <input id="ed-question-id" class="ed-input" value={question.id} readOnly />
          </div>
          <div class="ed-field">
            <label class="ed-label" for="ed-question-unit">
              単元コード
            </label>
            <input id="ed-question-unit" class="ed-input" value={question.unit} readOnly />
          </div>
        </div>
        <div class="ed-metadata-row">
          <div class="ed-field">
            <label class="ed-label" for="ed-question-subject">
              教科
            </label>
            <select
              id="ed-question-subject"
              class="ed-select"
              value={question.subject}
              onChange={(event) =>
                onFieldChange('subject', (event.target as HTMLSelectElement).value as Subject)
              }
            >
              <option value="sansu">算数</option>
              <option value="kokugo">国語</option>
              <option value="rika">理科</option>
              <option value="shakai">社会</option>
              <option value="seikatsu">生活</option>
              <option value="eigo">英語</option>
            </select>
          </div>
          <div class="ed-field">
            <label class="ed-label" for="ed-question-grade">
              学年
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
          <div class="ed-field">
            <label class="ed-label" for="ed-question-time-limit">
              制限時間・秒
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
            <label class="ed-label" for="ed-question-type">
              問題タイプ
            </label>
            <select
              id="ed-question-type"
              class="ed-select"
              value={question.type}
              disabled={!canChangeType}
              onChange={(event) => {
                const select = event.target as HTMLSelectElement;
                const value = select.value;
                select.value = question.type;
                changeType(value);
              }}
            >
              {!canChangeType && <option value={question.type}>{question.type}</option>}
              {canChangeType && (
                <>
                  <option value="choice">選択式</option>
                  <option value="text-input">記述式</option>
                </>
              )}
            </select>
          </div>
        </div>
        <div class="ed-field">
          <label class="ed-label" for="ed-question-explanation">
            解説文
          </label>
          <textarea
            id="ed-question-explanation"
            class="ed-textarea"
            value={question.explanation ?? ''}
            onInput={(event) => onFieldChange('explanation', (event.target as HTMLTextAreaElement).value)}
          />
        </div>
      </div>
    </>
  );
}
