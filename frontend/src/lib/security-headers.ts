export interface SecurityHeader {
  key: string;
  value: string;
}

interface SecurityHeaderOptions {
  /** Origin of the WebSocket server, e.g. `wss://api.example.com`. */
  wsUrl?: string | undefined;
  /** When true the CSP is enforced; otherwise it is sent as report-only. */
  enforceCsp?: boolean;
  /** Next.js dev needs `unsafe-eval` for hot reloading. */
  isDev?: boolean;
}

function originOf(url: string | undefined): string | null {
  if (!url) return null;
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
}

/**
 * Builds the Content-Security-Policy for the app. Only the origins the app
 * needs are allowed: itself, its WebSocket server, the Stellar RPC/Horizon
 * endpoints, and Sentry.
 */
export function buildCsp({ wsUrl, isDev = false }: SecurityHeaderOptions = {}): string {
  const connectSrc = [
    "'self'",
    originOf(wsUrl),
    "https://*.stellar.org",
    "https://*.sentry.io",
  ].filter((value): value is string => Boolean(value));

  const directives: Record<string, string[]> = {
    "default-src": ["'self'"],
    // Next.js emits inline bootstrap scripts, so a nonce-less policy has to
    // allow them; everything else stays same-origin.
    "script-src": ["'self'", "'unsafe-inline'", ...(isDev ? ["'unsafe-eval'"] : [])],
    "style-src": ["'self'", "'unsafe-inline'"],
    "img-src": ["'self'", "data:", "blob:", "https:"],
    "font-src": ["'self'", "data:"],
    "connect-src": connectSrc,
    "frame-ancestors": ["'none'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'"],
    "object-src": ["'none'"],
  };

  return Object.entries(directives)
    .map(([name, values]) => `${name} ${values.join(" ")}`)
    .join("; ");
}

/**
 * Security headers for every route. The CSP ships as report-only unless
 * `enforceCsp` is set, so violations can be observed before it is enforced;
 * clickjacking protection (`X-Frame-Options`) is enforced either way because
 * `frame-ancestors` is ignored in report-only mode.
 */
export function buildSecurityHeaders(options: SecurityHeaderOptions = {}): SecurityHeader[] {
  return [
    {
      key: options.enforceCsp
        ? "Content-Security-Policy"
        : "Content-Security-Policy-Report-Only",
      value: buildCsp(options),
    },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    {
      key: "Permissions-Policy",
      value: "camera=(), microphone=(), geolocation=()",
    },
    {
      key: "Strict-Transport-Security",
      value: "max-age=63072000; includeSubDomains",
    },
  ];
}
