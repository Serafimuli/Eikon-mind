import type { NextConfig } from "next"
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare"

initOpenNextCloudflareForDev()

const nextConfig: NextConfig = {
  images: { unoptimized: true },
  typedRoutes: false,
}

export default nextConfig
