import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

initOpenNextCloudflareForDev();

const nextConfig: NextConfig = {
  allowedDevOrigins: ["localhost", "127.0.0.1"],
  experimental: { sri: { algorithm: "sha256" } },
  images: { unoptimized: true },
  poweredByHeader: false,
  typedRoutes: true,
};

export default nextConfig;
