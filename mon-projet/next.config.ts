import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // REMOVED: The rewrites were conflicting with the API route proxy
  // All proxying is now handled by app/api/[...path]/route.ts
};

export default nextConfig;