import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    config.externals.push("pino-pretty", "encoding");
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };

    // Ignore node-specific and test modules
    config.resolve.alias = {
      ...config.resolve.alias,
    };

    return config;
  },
};

export default nextConfig;
