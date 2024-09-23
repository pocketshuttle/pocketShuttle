/** @type {import('next').NextConfig} */
import withPWAInit from "@ducanh2912/next-pwa";
import { exec } from "child_process";
import { debug } from "console";

const withPWA = withPWAInit({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  swcMinify: true,
  // disable: process.env.NODE_ENV === "development",
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
  debug: true,
};

export default withPWA(nextConfig);
