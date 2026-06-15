import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  // Set this to your GitHub Pages repo name if deploying to <user>.github.io/<repo>
  // basePath: '/kernel-demo',
  // assetPrefix: '/kernel-demo/',
  images: { unoptimized: true },
};

export default nextConfig;
