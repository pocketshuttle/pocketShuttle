/** @type {import('next').NextConfig} */
import withPWAInit from "@ducanh2912/next-pwa";
import { exec } from "child_process";
// import withPWA  from ('next-pwa')({
//   dest: 'public'
// })

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
  // ... other options you like
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

export default withPWA({
  nextConfig,
});
