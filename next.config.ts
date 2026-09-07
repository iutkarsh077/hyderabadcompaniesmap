import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["mongoose"],
  turbopack: {
    root: path.join(__dirname),
  },
  webpack: (config) => {
    config.module ??= {};
    const existing = config.module.noParse;
    const skipMaplibre = /[\\/]maplibre-gl[\\/]dist[\\/]maplibre-gl/;
    if (Array.isArray(existing)) {
      config.module.noParse = [...existing, skipMaplibre];
    } else if (existing) {
      config.module.noParse = [existing, skipMaplibre];
    } else {
      config.module.noParse = [skipMaplibre];
    }
    return config;
  },
};

export default nextConfig;
