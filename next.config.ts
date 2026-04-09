import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/llm-debate-arena",
  images: { unoptimized: true },
};

export default nextConfig;
