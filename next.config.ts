import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    ignoreDuringBuilds: true, // ⛔️ Ini yang men-disable linting saat build
  },
};

export default nextConfig;
