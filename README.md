# Dropoff (PocketShuttle)

A realtime movement accountability and safety platform — trip tracking between drivers, parents, teachers, and students, with school/organization admin tooling and subscription billing.

## Stack

- **Web app:** Next.js 15 (App Router), React 18, TypeScript, Tailwind CSS + Radix UI + MUI.
- **Realtime backend:** Express + Socket.IO (`dropoff-backend/`), deployed separately (Render), used for school bus tracking (teacher → parent, dashboard map).
- **Realtime (secondary):** Pusher, used for the standalone driver ↔ parent connection feature.
- **Database:** PostgreSQL via Prisma (`packages/db/`).
- **Auth:** Custom JWT session (`lib/create-session.ts`), httpOnly cookie.
- **Notifications:** Knock (in-app feed), OneSignal (push), Resend (email), Twilio (SMS).
- **Payments:** Paystack.
- **Background jobs:** Upstash QStash.
- **Media:** Cloudinary.
- **Error tracking:** Sentry (no-ops until `SENTRY_DSN`/`NEXT_PUBLIC_SENTRY_DSN` are set).
- **Rate limiting:** Upstash Redis-backed (`lib/rate-limit.ts`), falls back to in-memory (single-instance only) when Redis isn't configured.

## Project structure

This is an npm-workspaces monorepo:

- `app/` — Next.js App Router pages and API routes.
- `dropoff-backend/` — standalone Socket.IO service (`@dropoff/backend` workspace).
- `packages/db/` — shared Prisma package (`@dropoff/db`): schema, migrations, seed scripts.
- `apps/mobile/` — placeholder for a future mobile app (not yet built out).
- `components/`, `hooks/`, `lib/`, `services/`, `actions/`, `schemas/` — app code.
- `docs/` — engineering playbook, admin/billing/QStash docs.
- `tests/` — Node test-runner suites (`tsx --test`), run via `npm test`.

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in real values
npm run dev                  # runs the Next.js app + backend concurrently
```

Individual dev servers: `npm run dev:web` (Next.js) and `npm run dev:backend` (Socket.IO backend).

## Scripts

- `npm run build` — generate the Prisma client and build the Next.js app.
- `npm run typecheck` — `tsc --noEmit`.
- `npm run lint` — `next lint`.
- `npm test` — runs all test suites (`test:cron`, `test:subscriptions`, `test:admin`, `test:lib`).
- `npm run db:seed` / `npm run db:seed:plans` — seed the database.
- `npm run qstash:sync` / `qstash:check` / `qstash:remove` — manage QStash cron schedules (see `docs/qstash-scheduling.md`).

## Docs

See `docs/engineering-playbook.md` for the product/architecture model, `docs/platform-admin.md` for the admin panel, `docs/subscriptions.md` for billing, and `docs/qstash-scheduling.md` for the cron staging→production promotion process.
