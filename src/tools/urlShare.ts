/**
 * URL Sharing utilities for Nihonquest Question Editor
 * Allows encoding question JSON to Base64 URL parameter / hash
 * and generating shareable links.
 */
import type { QuestionBase } from '../questions/contracts';

/** Encode string into UTF-8 safe Base64 string */
export function encodeQuestionToHash(question: QuestionBase): string {
  try {
    const jsonStr = JSON.stringify(question);
    const bytes = new TextEncoder().encode(jsonStr);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      const b = bytes[i];
      if (b !== undefined) binary += String.fromCharCode(b);
    }
    return btoa(binary);
  } catch (e) {
    console.error('Failed to encode question:', e);
    return '';
  }
}

/** Decode UTF-8 Base64 string back into object */
export function decodeQuestionFromHash(encoded: string): unknown | null {
  try {
    const binary = atob(encoded);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    const jsonStr = new TextDecoder().decode(bytes);
    return JSON.parse(jsonStr);
  } catch {
    // URL hashes are untrusted input. Invalid or truncated shared data is an
    // expected case, so let the editor ignore it without emitting a false error.
    return null;
  }
}

/** Read data & room parameters from URL hash (#data=...&room=...) or query string */
export function parseUrlState(): { data: unknown | null; roomId: string | null } {
  const hash = window.location.hash.startsWith('#') ? window.location.hash.slice(1) : window.location.hash;
  const params = new URLSearchParams(hash || window.location.search);

  const rawData = params.get('data');
  const roomId = params.get('room');

  const data = rawData ? decodeQuestionFromHash(rawData) : null;
  return { data, roomId };
}

/** Build share URL with room ID and/or encoded data */
export function buildShareUrl(options: { question?: QuestionBase; roomId?: string }): string {
  const url = new URL(window.location.href);
  const params = new URLSearchParams();

  if (options.roomId) {
    params.set('room', options.roomId);
  }
  if (options.question) {
    const encoded = encodeQuestionToHash(options.question);
    if (encoded) params.set('data', encoded);
  }

  url.hash = params.toString();
  return url.toString();
}

/** Copy text to user clipboard */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for older environments
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    try {
      textArea.select();
      return document.execCommand('copy');
    } catch {
      return false;
    } finally {
      textArea.remove();
    }
  }
}
