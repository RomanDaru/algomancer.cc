import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "calebgannon.com",
        pathname: "/wp-content/uploads/**",
      },
      {
        protocol: "https",
        hostname: "calebgannon.com",
        pathname: "/wp-content/uploads/cardsearch-images/**",
      },
    ],
  },
};

export default nextConfig;
