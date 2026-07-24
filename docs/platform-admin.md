# PocketShuttle platform administration

The `/admin` console is the platform control plane for family, school, driver,
teacher, billing, safety, support, and enterprise operations.

## Runtime configuration

- `PLATFORM_ADMIN_V2`: set to `false` to retain the legacy unrestricted admin
  navigation while deploying the schema and permissions. It is enabled by
  default.
- `NEXT_PUBLIC_BASE_URL`: canonical application URL used in admin invitation
  links and origin validation.
- `RESEND_API_KEY`: sends platform-admin invitations. A failed delivery leaves
  the invitation pending and retryable. Development responses expose the
  one-time invitation URL; production responses never do.
- `CRON_SECRET`: protects the support-retention job and the existing scheduled
  jobs.

## Roles

- `OWNER` has unrestricted platform access and is the only role that can
  grant, demote, or deactivate another owner.
- `ADMIN` manages customers, operations, billing, support, enterprise
  configuration, and non-owner admins.
- `SUPPORT` can inspect accounts, operate support, verify drivers, and open
  customer workspaces in read-only mode.
- `BILLING` can inspect accounts and manage subscriptions, plans, overrides,
  payments, and billing reports.
- `READ_ONLY` can view dashboards, accounts, operations, reports, and audits.

The oldest existing super-admin becomes the initial owner. The application
prevents self-deactivation and prevents removal of the last active owner.
Admin role changes and deactivation require the acting admin's current
password.

## Invitations

Owners and admins create invitations from **Admin → Admins → Create admin**.
Invitation tokens are random, SHA-256 hashed at rest, single-use, and expire
after 48 hours. The recipient creates a password of at least 12 characters;
PocketShuttle never creates or emails a password.

## Managed workspaces

Account detail pages provide **Open workspace** for schools, parents, drivers,
and teachers. Starting a session requires a reason and creates a persisted,
audited 30-minute workspace session. A permanent banner identifies the target,
the platform actor, and the remaining time.

Customer authorization and subscription limits remain active against the
effective customer identity. Managed mode blocks credential and recovery
changes, checkout and payment-method access, panic actions, fabricated
location updates, and customer-authored support requests. Every managed
mutation retains both the real platform actor and effective customer in the
audit trail.

## Scheduled retention

Vercel calls `/api/cron-jobs/support-retention` daily. It deletes support
tickets older than 21 days and replaces the former destructive page-render
cleanup. Production requests require `Authorization: Bearer $CRON_SECRET`.

## Verification

```bash
npm run test:admin
npm run test:subscriptions
npm run typecheck
npm run build
```
