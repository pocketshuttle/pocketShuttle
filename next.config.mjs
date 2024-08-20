/** @type {import('next').NextConfig} */

import { exec } from "child_process";

/** @type {import('next').NextConfig} */
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
    return [];
  },
};

export default nextConfig;
