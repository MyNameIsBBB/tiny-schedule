import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  experimental: {
    serverActions: {
      allowedOrigins: [
        'tinyschedule.taile459d4.ts.net',
        '100.78.12.45:3002',
        'localhost:3002'
      ]
    }
  }
};

export default nextConfig;
