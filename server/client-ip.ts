import { isIP } from 'node:net';
export function clientIp(
  socket: string | undefined,
  forwarded: string | null,
  trustedProxy: string | undefined,
): string {
  const peer = socket?.replace(/^::ffff:/, '') ?? 'unknown';
  // A trusted proxy must OVERWRITE a single client IP, never append an untrusted chain.
  if (trustedProxy && isIP(trustedProxy) && peer === trustedProxy && forwarded && isIP(forwarded))
    return forwarded;
  return peer;
}
