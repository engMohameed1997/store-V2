import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  async redirects() {
    if (process.env.NODE_ENV === "production") {
      return [
        { source: "/docs", destination: "/", permanent: false },
        { source: "/docs/:path*", destination: "/", permanent: false },
      ];
    }
    return [];
  },
};

export default nextConfig;
