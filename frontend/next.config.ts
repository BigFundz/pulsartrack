import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";
import { buildSecurityHeaders } from "./src/lib/security-headers";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["@stellar/stellar-sdk", "@stellar/stellar-base"],
  async headers() {
    return [
      {
        source: "/:path*",
        headers: buildSecurityHeaders({
          wsUrl: process.env.NEXT_PUBLIC_WS_URL,
          enforceCsp: process.env.CSP_MODE === "enforce",
          isDev: process.env.NODE_ENV !== "production",
        }),
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  silent: true,
  disableLogger: true,
});
