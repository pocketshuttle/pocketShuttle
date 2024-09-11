/** @type {import('next').NextConfig} */
import withPWAInit from "@ducanh2912/next-pwa";
import { exec } from "child_process";

const withPWA = withPWAInit({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  swcMinify: true,
  disable: process.env.NODE_ENV === "development",
  workboxOptions: {
    disableDevLogs: true,
  },
});

const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  async rewrites() {
    return [];
  },
  baseUrl: process.env.NEXT_PUBLIC_BASE_URL,
};

export default withPWA(nextConfig);
