/**
 * Real-time Collaboration Engine for Nihonquest Question Editor
 * Uses BroadcastChannel for local multi-tab sync and structured presence management.
 */
import type { QuestionBase } from '../questions/contracts';

export interface Collaborator {
  id: string;
  name: string;
  color: string;
  focusedField?: string | null;
  lastSeen: number;
}

export type CollabMessage =
  | { type: 'JOIN'; sender: Collaborator }
  | { type: 'HEARTBEAT'; sender: Collaborator }
  | { type: 'UPDATE_QUESTION'; senderId: string; question: QuestionBase }
  | { type: 'FOCUS_FIELD'; senderId: string; field: string | null }
  | { type: 'LEAVE'; senderId: string };

const ADJECTIVES = ['あおぞら', 'ひらめき', 'ドット', 'あかふじ', 'みどり', 'きらめき', 'もみじ', 'ほしぞら'];
const NAMES = ['ハル', 'ポチ', 'サスケ', 'ツムギ', 'モモ', 'ライゾウ', 'カエデ', 'ソラ'];
const COLORS = ['#e53935', '#1e88e5', '#43a047', '#fdd835', '#8e24aa', '#fb8c00', '#00acc1', '#d81b60'];

function getRandomInt(max: number): number {
  const arr = new Uint32Array(1);
  crypto.getRandomValues(arr);
  return (arr[0] ?? 0) % max;
}

export function generateRandomUser(): { name: string; color: string } {
  const adj = ADJECTIVES[getRandomInt(ADJECTIVES.length)] ?? 'ドット';
  const name = NAMES[getRandomInt(NAMES.length)] ?? 'ハル';
  const color = COLORS[getRandomInt(COLORS.length)] ?? '#1e88e5';
  return { name: `${adj}${name}`, color };
}

export function generateRoomId(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(getRandomInt(chars.length));
  }
  return `nq-${result}`;
}

export class CollaborationRoom {
  public roomId: string;
  public localUser: Collaborator;
  private channel: BroadcastChannel | null = null;
  private peers: Map<string, Collaborator> = new Map();
  private heartbeatTimer: number | null = null;
  private cleanupTimer: number | null = null;

  public onQuestionUpdate?: (question: QuestionBase, senderId: string) => void;
  public onPeersChange?: (peers: Collaborator[]) => void;

  constructor(roomId: string, username?: string, userColor?: string) {
    this.roomId = roomId;
    const fallback = generateRandomUser();
    const randomHex = getRandomInt(0xffffff).toString(36);
    this.localUser = {
      id: `user-${randomHex}`,
      name: username || fallback.name,
      color: userColor || fallback.color,
      focusedField: null,
      lastSeen: Date.now(),
    };

    this.initChannel();
  }

  private initChannel() {
    if (typeof BroadcastChannel === 'undefined') return;

    this.channel = new BroadcastChannel(`nihonquest-room-${this.roomId}`);
    this.channel.onmessage = (event: MessageEvent<CollabMessage>) => {
      this.handleMessage(event.data);
    };

    // Broadcast join
    this.postMessage({ type: 'JOIN', sender: this.localUser });

    // Periodic heartbeat (every 3s)
    this.heartbeatTimer = window.setInterval(() => {
      this.localUser.lastSeen = Date.now();
      this.postMessage({ type: 'HEARTBEAT', sender: this.localUser });
    }, 3000);

    // Periodic peer cleanup (remove inactive peers after 8s)
    this.cleanupTimer = window.setInterval(() => {
      const now = Date.now();
      let changed = false;
      for (const [id, peer] of this.peers.entries()) {
        if (now - peer.lastSeen > 8000) {
          this.peers.delete(id);
          changed = true;
        }
      }
      if (changed && this.onPeersChange) {
        this.onPeersChange(this.getPeers());
      }
    }, 4000);
  }

  private postMessage(msg: CollabMessage) {
    try {
      this.channel?.postMessage(msg);
    } catch (e) {
      console.error('Error posting collab message:', e);
    }
  }

  private handleMessage(msg: CollabMessage) {
    if (!msg) return;

    if (msg.type === 'JOIN' || msg.type === 'HEARTBEAT') {
      if (msg.sender.id === this.localUser.id) return;
      const isNew = !this.peers.has(msg.sender.id);
      this.peers.set(msg.sender.id, { ...msg.sender, lastSeen: Date.now() });

      if (msg.type === 'JOIN') {
        // Send our own heartbeat back so the joining user knows about us
        this.postMessage({ type: 'HEARTBEAT', sender: this.localUser });
      }

      if (isNew && this.onPeersChange) {
        this.onPeersChange(this.getPeers());
      }
    } else if (msg.type === 'UPDATE_QUESTION') {
      if (msg.senderId === this.localUser.id) return;
      if (this.onQuestionUpdate) {
        this.onQuestionUpdate(msg.question, msg.senderId);
      }
    } else if (msg.type === 'FOCUS_FIELD') {
      if (msg.senderId === this.localUser.id) return;
      const peer = this.peers.get(msg.senderId);
      if (peer) {
        peer.focusedField = msg.field;
        peer.lastSeen = Date.now();
        if (this.onPeersChange) this.onPeersChange(this.getPeers());
      }
    } else if (msg.type === 'LEAVE') {
      if (this.peers.delete(msg.senderId)) {
        if (this.onPeersChange) this.onPeersChange(this.getPeers());
      }
    }
  }

  public broadcastQuestionUpdate(question: QuestionBase) {
    this.postMessage({
      type: 'UPDATE_QUESTION',
      senderId: this.localUser.id,
      question,
    });
  }

  public broadcastFocusField(field: string | null) {
    this.localUser.focusedField = field;
    this.postMessage({
      type: 'FOCUS_FIELD',
      senderId: this.localUser.id,
      field,
    });
  }

  public getPeers(): Collaborator[] {
    return Array.from(this.peers.values());
  }

  public destroy() {
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    if (this.cleanupTimer) clearInterval(this.cleanupTimer);
    this.postMessage({ type: 'LEAVE', senderId: this.localUser.id });
    this.channel?.close();
  }
}
