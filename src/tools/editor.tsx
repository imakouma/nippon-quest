/**
 * Question Web Editor & Collaborative Real-Time Suite (docs/01 §3.4)
 * Allows visual question editing, JSON editing, live preview, URL sharing,
 * and real-time collaboration between multiple users.
 */
import { render } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import {
  questionBaseSchema,
  type Grade,
  type QuestionBase,
  type QuestionResult,
  type Subject,
} from '../questions/contracts';
import { allRenderers, getRenderer } from '../questions/renderers/registry';
import { fetchReader } from '../core/content/loader';
import { setDictionary, type I18nDict } from '../ui/i18n';
import { createSpeaker } from '../ui/overlay';
import { kanjiGradeTable, setKanjiLevel } from '../ui/ruby';
import { CollaborationRoom, generateRoomId, type Collaborator } from './collaboration';
import { SAMPLE_QUESTIONS } from './editorSamples';
import { buildShareUrl, copyToClipboard, parseUrlState } from './urlShare';
import '../questions/renderers/shared/questions.css';
import './editor.css';

const base = import.meta.env.BASE_URL.replace(/\/$/, '');
const read = fetchReader(`${base}/content`);
const assets = { image: (p: string) => `${base}/assets/${p}`, audio: (p: string) => `${base}/assets/${p}` };
const speak = createSpeaker();

function App() {
  const [question, setQuestion] = useState<QuestionBase>(SAMPLE_QUESTIONS[0]!);
  const [jsonText, setJsonText] = useState<string>(JSON.stringify(SAMPLE_QUESTIONS[0]!, null, 2));
  const [tab, setTab] = useState<'form' | 'json'>('form');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [result, setResult] = useState<QuestionResult | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Collaboration State
  const [roomId, setRoomId] = useState<string>('');
  const [peers, setPeers] = useState<Collaborator[]>([]);
  const roomRef = useRef<CollaborationRoom | null>(null);
  const isRemoteUpdate = useRef<boolean>(false);

  // Stage & Renderer Refs
  const stageRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // 問題UIはゲームと同じ 960x540 を基準に描き、エディタの表示幅に合わせて比率を保ったまま縮小する。
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const resize = () => {
      const width = Math.max(0, stage.getBoundingClientRect().width - 4);
      const scale = Math.min(1, width / 960);
      stage.style.setProperty('--ed-preview-scale', String(scale));
      stage.style.height = `${540 * scale + 4}px`;
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(stage);
    return () => observer.disconnect();
  }, []);

  // Toast helper
  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // Load i18n & kanji tables
  useEffect(() => {
    read('i18n/ja.json')
      .then((d) => setDictionary(d as I18nDict))
      .catch((e) => console.error(e));
    Promise.all([read('i18n/kanji-grades.json'), read('i18n/proper-nouns.json')])
      .then(([g, n]) => {
        setKanjiLevel({
          grade: question.grade,
          table: kanjiGradeTable((g as { byGrade: Record<string, string> }).byGrade),
          names: new Set((n as { names: string[] }).names),
        });
      })
      .catch((e) => console.error(e));
  }, []);

  // Initialize Room & Load initial URL state
  useEffect(() => {
    const { data, roomId: urlRoom } = parseUrlState();
    const activeRoom = urlRoom || generateRoomId();
    setRoomId(activeRoom);

    if (data && typeof data === 'object') {
      const parsed = questionBaseSchema.safeParse(data);
      if (parsed.success) {
        setQuestion(parsed.data as QuestionBase);
        setJsonText(JSON.stringify(parsed.data, null, 2));
      }
    }

    // Set URL Hash if not set
    const newUrl = buildShareUrl({
      roomId: activeRoom,
      question: data ? (data as QuestionBase) : question,
    });
    window.history.replaceState(null, '', newUrl);

    // Init Collab Room
    const room = new CollaborationRoom(activeRoom);
    roomRef.current = room;

    room.onPeersChange = (newPeers) => setPeers(newPeers);
    room.onQuestionUpdate = (remoteQ) => {
      isRemoteUpdate.current = true;
      setQuestion(remoteQ);
      setJsonText(JSON.stringify(remoteQ, null, 2));
      showToast('他の編集者が問題を更新しました');
      setTimeout(() => {
        isRemoteUpdate.current = false;
      }, 50);
    };

    return () => {
      room.destroy();
    };
  }, []);

  // Validate question & mount renderer preview
  const updateQuestionState = (newQ: QuestionBase, skipBroadcast = false) => {
    setQuestion(newQ);
    const text = JSON.stringify(newQ, null, 2);
    setJsonText(text);

    const check = questionBaseSchema.safeParse(newQ);
    if (!check.success) {
      setValidationError(check.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('\n'));
      return;
    }

    const renderer = getRenderer(newQ.type);
    if (renderer) {
      const payloadCheck = renderer.schema.safeParse(newQ.payload);
      if (!payloadCheck.success) {
        setValidationError(
          `payload エラー: ${payloadCheck.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', ')}`,
        );
        return;
      }
    }

    setValidationError(null);

    // Broadcast if updated locally
    if (!skipBroadcast && !isRemoteUpdate.current && roomRef.current) {
      roomRef.current.broadcastQuestionUpdate(newQ);
    }
  };

  // Mount/preview logic
  const renderPreview = async () => {
    const stage = stageRef.current;
    if (!stage) return;
    abortRef.current?.abort();
    // 終了が遅れた旧レンダラーが render(null, container) しても、新しい表示を消せないよう
    // 描画ごとに独立したホストを割り当てる。
    const host = document.createElement('div');
    host.className = 'ed-render-host';
    stage.replaceChildren(host);

    const renderer = getRenderer(question.type);
    if (!renderer) {
      setValidationError(`未登録の問題タイプ: "${question.type}"`);
      return;
    }

    const payloadCheck = renderer.schema.safeParse(question.payload);
    if (!payloadCheck.success) {
      setValidationError(
        `payload エラー: ${payloadCheck.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', ')}`,
      );
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const res = await renderer.mount({
        container: host,
        question: { ...question, payload: payloadCheck.data },
        grade: question.grade,
        assets,
        speak,
        timeLimitMs: (question.timeLimitSec ?? 20) * 1000,
        signal: controller.signal,
      });

      if (!controller.signal.aborted) {
        setResult(res);
      }
    } catch (e) {
      if (!controller.signal.aborted) {
        setValidationError(`レンダリングエラー: ${(e as Error).message}`);
      }
    }
  };

  useEffect(() => {
    if (!validationError) {
      renderPreview();
    }
  }, [question, validationError]);

  // Handle JSON Text Editor Changes
  const handleJsonChange = (val: string) => {
    setJsonText(val);
    try {
      const parsed = JSON.parse(val);
      updateQuestionState(parsed);
    } catch (e) {
      setValidationError(`JSON構文エラー: ${(e as Error).message}`);
    }
  };

  // Handle Form Input Updates
  const handleFieldChange = (field: keyof QuestionBase, val: unknown) => {
    const updated = { ...question, [field]: val };
    updateQuestionState(updated);
  };

  const handlePayloadChange = (payloadKey: string, val: unknown) => {
    const currentPayload = (
      question.payload && typeof question.payload === 'object' ? question.payload : {}
    ) as Record<string, unknown>;
    const updatedPayload = { ...currentPayload, [payloadKey]: val };
    const updated = { ...question, payload: updatedPayload };
    updateQuestionState(updated);
  };

  // Share Actions
  const handleCopyShareUrl = async () => {
    const url = buildShareUrl({ roomId, question });
    const ok = await copyToClipboard(url);
    if (ok) showToast('共有URLをクリップボードにコピーしました！');
  };

  const handleCopyRoomId = async () => {
    const ok = await copyToClipboard(roomId);
    if (ok) showToast(`ルームID "${roomId}" をコピーしました！`);
  };

  const handleExportJson = () => {
    const blob = new Blob([JSON.stringify(question, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${question.id || 'question'}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('JSONファイルをダウンロードしました');
  };

  const handleImportJson = (e: Event) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const parsed = JSON.parse(evt.target?.result as string);
        updateQuestionState(parsed);
        showToast('JSONファイルを読み込みました');
      } catch (err) {
        alert(`JSONの読み込みに失敗しました: ${(err as Error).message}`);
      }
    };
    reader.readAsText(file);
  };

  const rawChoices = (question.payload as Record<string, unknown>)?.choices;
  const choices = Array.isArray(rawChoices)
    ? rawChoices.filter(
        (choice): choice is { id: string; text?: string; image?: string; audio?: string } =>
          !!choice && typeof choice === 'object' && typeof (choice as { id?: unknown }).id === 'string',
      )
    : [];

  return (
    <div class="ed-container">
      {/* Header Bar */}
      <header class="ed-header">
        <div class="ed-title">
          <span>🎮 ニホンクエスト 問題Webエディタ</span>
          <div class="ed-badge-room">
            <span class="ed-dot-online"></span>
            <span>Room: {roomId}</span>
          </div>
        </div>

        {/* Collaborators list */}
        <div class="ed-peers">
          {roomRef.current && (
            <div
              class="ed-avatar ed-avatar-me"
              style={{ backgroundColor: roomRef.current.localUser.color }}
              title={`自分: ${roomRef.current.localUser.name}`}
            >
              {roomRef.current.localUser.name[0]}
            </div>
          )}
          {peers.map((peer) => (
            <div
              key={peer.id}
              class="ed-avatar"
              style={{ backgroundColor: peer.color }}
              title={`参加中: ${peer.name}`}
            >
              {peer.name[0]}
            </div>
          ))}
        </div>

        {/* Actions */}
        <div class="ed-actions">
          <button class="ed-btn ed-btn-success" onClick={handleCopyShareUrl}>
            🔗 共有URLをコピー
          </button>
          <button class="ed-btn" onClick={handleCopyRoomId}>
            📋 ルームIDコピー
          </button>
          <button class="ed-btn" onClick={handleExportJson}>
            💾 JSON保存
          </button>
          <label class="ed-btn">
            📂 JSON開く
            <input type="file" accept=".json" onChange={handleImportJson} style={{ display: 'none' }} />
          </label>
          <a class="ed-btn" href={`${base}/playground.html`}>
            👈 Playgroundへ
          </a>
        </div>
      </header>

      {/* Main Layout */}
      <div class="ed-main">
        {/* Left: Form & JSON Editor */}
        <div class="ed-panel">
          <div class="ed-tabs">
            <button class={`ed-tab ${tab === 'form' ? 'active' : ''}`} onClick={() => setTab('form')}>
              📝 ビジュアルフォーム
            </button>
            <button class={`ed-tab ${tab === 'json' ? 'active' : ''}`} onClick={() => setTab('json')}>
              💻 生JSON編集
            </button>
          </div>

          <div class="ed-form-scroll">
            {/* Presets */}
            <div class="ed-group">
              <div class="ed-group-title">
                <span>サンプルテンプレート</span>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button class="ed-btn" onClick={() => updateQuestionState(SAMPLE_QUESTIONS[0]!)}>
                  算数（選択肢）
                </button>
                <button class="ed-btn" onClick={() => updateQuestionState(SAMPLE_QUESTIONS[1]!)}>
                  英語（絵と単語）
                </button>
              </div>
            </div>

            {tab === 'form' ? (
              <>
                {/* Meta Settings */}
                <div class="ed-group">
                  <div class="ed-group-title">基本メタデータ</div>
                  <div class="ed-field">
                    <label class="ed-label">問題 ID</label>
                    <input
                      class="ed-input"
                      value={question.id}
                      onInput={(e) => handleFieldChange('id', (e.target as HTMLInputElement).value)}
                    />
                  </div>
                  <div class="ed-field">
                    <label class="ed-label">問題タイプ (type)</label>
                    <select
                      class="ed-select"
                      value={question.type}
                      onChange={(e) => {
                        const newType = (e.target as HTMLSelectElement).value;
                        let defaultPayload: unknown = {};
                        if (newType === 'choice') {
                          defaultPayload = {
                            prompt: '問題文',
                            choices: [
                              { id: 'choice-1', text: '選択肢1' },
                              { id: 'choice-2', text: '選択肢2' },
                            ],
                            answer: 'choice-1',
                          };
                        } else if (newType === 'picture-word') {
                          defaultPayload = {
                            image: 'questions/eigo/apple.png',
                            words: [
                              { id: 'apple', text: 'apple' },
                              { id: 'banana', text: 'banana' },
                            ],
                            answer: 'apple',
                          };
                        }
                        updateQuestionState({ ...question, type: newType, payload: defaultPayload });
                      }}
                    >
                      {allRenderers().map((r) => (
                        <option key={r.type} value={r.type}>
                          {r.type}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div class="ed-field">
                      <label class="ed-label">教科 (subject)</label>
                      <select
                        class="ed-select"
                        value={question.subject}
                        onChange={(e) =>
                          handleFieldChange('subject', (e.target as HTMLSelectElement).value as Subject)
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
                      <label class="ed-label">学年 (grade)</label>
                      <select
                        class="ed-select"
                        value={question.grade}
                        onChange={(e) =>
                          handleFieldChange('grade', Number((e.target as HTMLSelectElement).value) as Grade)
                        }
                      >
                        {[1, 2, 3, 4, 5, 6].map((g) => (
                          <option key={g} value={g}>
                            小{g}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div class="ed-field">
                    <label class="ed-label">単元コード (unit)</label>
                    <input
                      class="ed-input"
                      value={question.unit}
                      onInput={(e) => handleFieldChange('unit', (e.target as HTMLInputElement).value)}
                    />
                  </div>
                  <div class="ed-field">
                    <label class="ed-label">制限時間 (秒)</label>
                    <input
                      type="number"
                      class="ed-input"
                      value={question.timeLimitSec ?? 20}
                      onInput={(e) =>
                        handleFieldChange('timeLimitSec', Number((e.target as HTMLInputElement).value))
                      }
                    />
                  </div>
                  <div class="ed-field">
                    <label class="ed-label">解説文 (RubyText)</label>
                    <textarea
                      class="ed-textarea"
                      value={question.explanation ?? ''}
                      onInput={(e) => handleFieldChange('explanation', (e.target as HTMLInputElement).value)}
                    />
                  </div>
                </div>

                {/* Renderer Payload Form */}
                <div class="ed-group">
                  <div class="ed-group-title">問題のコンテンツ ({question.type})</div>
                  {question.type === 'choice' && (
                    <>
                      <div class="ed-field">
                        <label class="ed-label">問題文 (prompt)</label>
                        <textarea
                          class="ed-textarea"
                          value={((question.payload as Record<string, unknown>)?.prompt as string) ?? ''}
                          onInput={(e) => handlePayloadChange('prompt', (e.target as HTMLInputElement).value)}
                        />
                      </div>
                      <div class="ed-field">
                        <label class="ed-label">選択肢一覧</label>
                        {choices.map((choice, i) => (
                          <div key={choice.id} class="ed-choice-row">
                            <input
                              type="radio"
                              name="correct"
                              class="ed-radio"
                              checked={
                                ((question.payload as Record<string, unknown>)?.answer as string) ===
                                choice.id
                              }
                              onChange={() => handlePayloadChange('answer', choice.id)}
                              title="正解の選択肢として指定"
                            />
                            <input
                              class="ed-input"
                              value={choice.text ?? ''}
                              onInput={(e) => {
                                const newChoices = [...choices];
                                newChoices[i] = {
                                  ...choice,
                                  text: (e.target as HTMLInputElement).value,
                                };
                                handlePayloadChange('choices', newChoices);
                              }}
                            />
                            <button
                              class="ed-btn"
                              onClick={() => {
                                const newChoices = choices.filter((_, idx) => idx !== i);
                                handlePayloadChange('choices', newChoices);
                              }}
                            >
                              ❌
                            </button>
                          </div>
                        ))}
                        <button
                          class="ed-btn"
                          style={{ marginTop: '6px' }}
                          onClick={() => {
                            let number = choices.length + 1;
                            while (choices.some((choice) => choice.id === `choice-${number}`)) number += 1;
                            handlePayloadChange('choices', [
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
                        <label class="ed-label">画像パス (image)</label>
                        <input
                          class="ed-input"
                          value={((question.payload as Record<string, unknown>)?.image as string) ?? ''}
                          onInput={(e) => handlePayloadChange('image', (e.target as HTMLInputElement).value)}
                        />
                      </div>
                      <div class="ed-field">
                        <label class="ed-label">正解の単語ID (answer)</label>
                        <input
                          class="ed-input"
                          value={((question.payload as Record<string, unknown>)?.answer as string) ?? ''}
                          onInput={(e) => handlePayloadChange('answer', (e.target as HTMLInputElement).value)}
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
            ) : (
              <div class="ed-group">
                <div class="ed-group-title">JSONデータ</div>
                <textarea
                  class="ed-input ed-json-textarea"
                  value={jsonText}
                  onInput={(e) => handleJsonChange((e.target as HTMLTextAreaElement).value)}
                />
              </div>
            )}
          </div>
        </div>

        {/* Right: Live Preview & Testing */}
        <div class="ed-stage-panel">
          <div class="ed-stage-header">
            <span class="ed-stage-title">リアルタイムプレビュー & 解答テスト</span>
            <button class="ed-btn ed-btn-primary" onClick={renderPreview}>
              🔄 再レンダリング
            </button>
          </div>

          {/* Validation Error Message */}
          {validationError && (
            <div class="ed-result-card">
              <div class="ed-error-box">{validationError}</div>
            </div>
          )}

          {/* 16:9 Stage Container */}
          <div class="ed-stage-box" id="ed-stage" ref={stageRef}></div>

          {/* Result Card */}
          {result && (
            <div class="ed-result-card">
              <div style={{ fontWeight: 'bold', color: '#4ade80', marginBottom: '4px' }}>
                🎉 解答テスト完了 (QuestionResult)
              </div>
              <pre style={{ margin: 0, font: '12px/1.4 ui-monospace, monospace', color: '#e2e8f0' }}>
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>

      {/* Toast Notification */}
      {toast && <div class="ed-toast">{toast}</div>}
    </div>
  );
}

render(<App />, document.getElementById('editor-root')!);
