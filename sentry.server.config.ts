import * as Sentry from "@sentry/nextjs";

// Sentry.init with an empty/undefined dsn is a documented no-op: the SDK
// stays inert until SENTRY_DSN is configured, so this is safe to ship
// without requiring a Sentry account to exist yet.
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 0.1,
  environment: process.env.NODE_ENV,
});
