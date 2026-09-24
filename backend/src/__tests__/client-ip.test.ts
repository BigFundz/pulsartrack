import { describe, it, expect } from 'vitest';
import { getTrustedProxyHops, resolveClientIp } from '../lib/client-ip';

function req(forwardedFor: string | undefined, remoteAddress = '10.0.0.1') {
  return {
    headers: forwardedFor === undefined ? {} : { 'x-forwarded-for': forwardedFor },
    socket: { remoteAddress },
  } as Parameters<typeof resolveClientIp>[0];
}

describe('client IP resolution', () => {
  it('ignores a spoofed X-Forwarded-For when no proxy is trusted', () => {
    expect(resolveClientIp(req('1.2.3.4'), 0)).toBe('10.0.0.1');
    expect(resolveClientIp(req('5.6.7.8'), 0)).toBe('10.0.0.1');
  });

  it('uses the address the trusted proxy saw as the client', () => {
    expect(resolveClientIp(req('203.0.113.9'), 1)).toBe('203.0.113.9');
  });

  it('ignores entries a client prepended ahead of the trusted proxy', () => {
    expect(resolveClientIp(req('6.6.6.6, 203.0.113.9'), 1)).toBe('203.0.113.9');
  });

  it('falls back to the socket address when the header is absent', () => {
    expect(resolveClientIp(req(undefined), 1)).toBe('10.0.0.1');
  });

  it('reads the hop count from TRUST_PROXY_HOPS, defaulting to 0', () => {
    expect(getTrustedProxyHops({})).toBe(0);
    expect(getTrustedProxyHops({ TRUST_PROXY_HOPS: 'abc' })).toBe(0);
    expect(getTrustedProxyHops({ TRUST_PROXY_HOPS: '-1' })).toBe(0);
    expect(getTrustedProxyHops({ TRUST_PROXY_HOPS: '2' })).toBe(2);
  });
});
