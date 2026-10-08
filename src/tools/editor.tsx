/**
 * Question Web Editor & Collaborative Real-Time Suite (docs/01 §3.4)
 * Allows visual question editing, JSON editing, live preview, URL sharing,
 * and real-time collaboration between multiple users.
 */
import { render } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import { questionBaseSchema, type QuestionBase, type QuestionResult } from '../questions/contracts';
import { getRenderer } from '../questions/renderers/registry';
import { fetchReader } from '../core/content/loader';
import { setDictionary, type I18nDict } from '../ui/i18n';
import { createSpeaker } from '../ui/overlay';
import { kanjiGradeTable, setKanjiLevel } from '../ui/ruby';
import { CollaborationRoom, generateRoomId, type Collaborator } from './collaboration';
import { EditorQuestionForm } from './editorQuestionForm';
import { isEditorQuestionDraft, SAMPLE_QUESTIONS, validateEditorQuestion } from './editorSamples';
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
    const sharedQuestion = validateEditorQuestion(data);
    setRoomId(activeRoom);

    if (sharedQuestion) {
      setQuestion(sharedQuestion);
      setJsonText(JSON.stringify(sharedQuestion, null, 2));
    }

    // Set URL Hash if not set
    const newUrl = buildShareUrl({
      roomId: activeRoom,
      question: sharedQuestion ?? question,
    });
    window.history.replaceState(null, '', newUrl);

    // Init Collab Room
    const room = new CollaborationRoom(activeRoom);
    roomRef.current = room;

    room.onPeersChange = (newPeers) => setPeers(newPeers);
    room.onQuestionUpdate = (remoteQ) => {
      const next = validateEditorQuestion(remoteQ);
      if (!next) {
        showToast('受信した問題データが不正なため無視しました');
        return;
      }
      isRemoteUpdate.current = true;
      setQuestion(next);
      setJsonText(JSON.stringify(next, null, 2));
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
  const updateQuestionState = (newQ: unknown, skipBroadcast = false) => {
    if (!isEditorQuestionDraft(newQ)) {
      setValidationError('問題データは JSON オブジェクトで入力してください');
      return;
    }
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
          <button type="button" class="ed-btn ed-btn-success" onClick={handleCopyShareUrl}>
            🔗 共有URLをコピー
          </button>
          <button type="button" class="ed-btn" onClick={handleCopyRoomId}>
            📋 ルームIDコピー
          </button>
          <button type="button" class="ed-btn" onClick={handleExportJson}>
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
            <button
              type="button"
              class={`ed-tab ${tab === 'form' ? 'active' : ''}`}
              onClick={() => setTab('form')}
            >
              📝 ビジュアルフォーム
            </button>
            <button
              type="button"
              class={`ed-tab ${tab === 'json' ? 'active' : ''}`}
              onClick={() => setTab('json')}
            >
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
                <button
                  type="button"
                  class="ed-btn"
                  onClick={() => updateQuestionState(SAMPLE_QUESTIONS[0]!)}
                >
                  算数（選択肢）
                </button>
                <button
                  type="button"
                  class="ed-btn"
                  onClick={() => updateQuestionState(SAMPLE_QUESTIONS[1]!)}
                >
                  英語（絵と単語）
                </button>
              </div>
            </div>

            {tab === 'form' ? (
              <EditorQuestionForm
                question={question}
                onQuestionChange={updateQuestionState}
                onFieldChange={handleFieldChange}
                onPayloadChange={handlePayloadChange}
              />
            ) : (
              <div class="ed-group">
                <div class="ed-group-title">JSONデータ</div>
                <textarea
                  aria-label="JSONデータ"
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
            <button type="button" class="ed-btn ed-btn-primary" onClick={renderPreview}>
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
