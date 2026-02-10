import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  // Enable React profiling in development
  compiler: {
    reactRemoveProperties: false,
  },
};

export default nextConfig;
