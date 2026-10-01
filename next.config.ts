import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // data/*.json is read from disk at build time; make sure it ships with server output too
  outputFileTracingIncludes: { "/**": ["./data/**/*"] },
};

export default nextConfig;
