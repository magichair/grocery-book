import path from "path"
import type { NextConfig } from "next"
import withPWA from "@ducanh2912/next-pwa"

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Standalone output bundles only what's needed to run — ideal for Docker.
  // outputFileTracingRoot tells Next.js the monorepo root so workspace packages
  // are included in the traced bundle.
  output: "standalone",
  outputFileTracingRoot: path.join(__dirname, "../../"),
}

export default withPWA({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === "development",
})(nextConfig)
