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
  // other options...
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
  webpack: (config, { isServer }) => {
    if (isServer) {
      exec(
        "node backgroundtask/background-worker.js",
        (error, stdout, stderr) => {
          if (error) {
            console.error(
              `Error executing background-worker.js: ${error.message}`
            );
            return;
          }
          if (stderr) {
            console.error(`stderr: ${stderr}`);
            return;
          }
          console.log(`stdout: ${stdout}`);
        }
      );
    }
    return config;
  },
};

export default withPWA(nextConfig);
