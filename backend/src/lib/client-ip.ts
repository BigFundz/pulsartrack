import type { IncomingMessage } from "http";

/**
 * How many reverse proxies sit in front of the app and are trusted to set
 * `X-Forwarded-For`. Read from `TRUST_PROXY_HOPS`; unset, empty, or invalid
 * means 0: forwarded headers are ignored and the socket address is used.
 */
export function getTrustedProxyHops(env: NodeJS.ProcessEnv = process.env): number {
  const hops = Number.parseInt(env.TRUST_PROXY_HOPS ?? "", 10);
  return Number.isInteger(hops) && hops > 0 ? hops : 0;
}

/**
 * The client IP for a raw Node request, used by the WebSocket server. It
 * follows the same rule as Express's numeric `trust proxy` setting (which
 * `req.ip` uses on the HTTP side), so both paths agree on who the client is.
 *
 * With 0 trusted hops the header is never read, so a client cannot choose its
 * own identity by sending `X-Forwarded-For`. With N trusted hops the address N
 * steps from the end of the forwarded chain (which ends at the socket peer) is
 * used, so entries a client prepends are ignored.
 */
export function resolveClientIp(
  req: Pick<IncomingMessage, "headers" | "socket">,
  trustedHops: number = getTrustedProxyHops(),
): string {
  const remote = req.socket.remoteAddress ?? "unknown";
  if (trustedHops <= 0) return remote;

  const header = req.headers["x-forwarded-for"];
  const forwarded = (Array.isArray(header) ? header.join(",") : (header ?? ""))
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
  const chain = [...forwarded, remote];
  return chain[Math.max(0, chain.length - 1 - trustedHops)] ?? remote;
}
