import { expect, it } from 'vitest';
import { clientIp } from '../../server/client-ip';
it('uses a client IP only from the explicitly trusted proxy', () => {
  expect(clientIp('10.0.0.8', '203.0.113.2', '10.0.0.8')).toBe('203.0.113.2');
  expect(clientIp('203.0.113.3', '203.0.113.2', '10.0.0.8')).toBe('203.0.113.3');
  expect(clientIp('10.0.0.8', '203.0.113.2, 203.0.113.3', '10.0.0.8')).toBe('10.0.0.8');
  expect(clientIp('10.0.0.8', '203.0.113.2', undefined)).toBe('10.0.0.8');
});
