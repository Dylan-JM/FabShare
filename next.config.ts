import type { NextConfig } from "next";

// Set by CI for GitHub Pages (e.g. /FabShare). Empty on Vercel/custom domains.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  output: "export",
  basePath,
  assetPrefix: basePath,
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
