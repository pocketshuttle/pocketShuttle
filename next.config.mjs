/** @type {import('next').NextConfig} */
const nextConfig = {
  // These packages use dynamic `require()` internally (OpenTelemetry's
  // Node instrumentation loader). Webpack can't statically bundle that, which
  // produces harmless but noisy "Critical dependency" warnings from Sentry's
  // Prisma auto-instrumentation. Keeping them external avoids the warning
  // since they run fine under plain Node `require` in the server runtime.
  serverExternalPackages: [
    "@sentry/node",
    "@opentelemetry/instrumentation",
    "@opentelemetry/instrumentation-http",
    "@prisma/instrumentation",
  ],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
    ],
  },
  async rewrites() {
    return [];
  },
  reactStrictMode: false,
};

export default nextConfig;
