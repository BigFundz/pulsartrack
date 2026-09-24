import { describe, it, expect } from "vitest";
import { buildCsp, buildSecurityHeaders } from "./security-headers";

describe("security headers", () => {
  it("forbids framing and allows only the needed connect origins", () => {
    const csp = buildCsp({ wsUrl: "wss://api.example.com/ws" });
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("connect-src 'self' wss://api.example.com https://*.stellar.org https://*.sentry.io");
    expect(csp).not.toContain("'unsafe-eval'");
  });

  it("allows unsafe-eval only in development", () => {
    expect(buildCsp({ isDev: true })).toContain("'unsafe-eval'");
  });

  it("sends the CSP as report-only unless enforcement is enabled", () => {
    const reportOnly = buildSecurityHeaders();
    expect(reportOnly.map((h) => h.key)).toContain("Content-Security-Policy-Report-Only");
    const enforced = buildSecurityHeaders({ enforceCsp: true });
    expect(enforced.map((h) => h.key)).toContain("Content-Security-Policy");
    expect(enforced.map((h) => h.key)).not.toContain("Content-Security-Policy-Report-Only");
  });

  it("always includes the standard hardening headers", () => {
    const keys = buildSecurityHeaders().map((h) => h.key);
    for (const key of [
      "X-Frame-Options",
      "X-Content-Type-Options",
      "Referrer-Policy",
      "Permissions-Policy",
      "Strict-Transport-Security",
    ]) {
      expect(keys).toContain(key);
    }
  });
});
