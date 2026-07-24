# PocketShuttle subscriptions

PocketShuttle resolves all paid access through a billing account. A billing
account belongs to a standalone family, a school, or an enterprise
organization. Known-driver assignment payments remain separate.

## Runtime configuration

Configure these server-side environment variables:

- `PAYSTACK_SECRET_KEY`: creates Paystack plans, initializes recurring checkout,
  verifies webhook signatures, and opens hosted subscription management.
- `CRON_SECRET`: protects subscription expiry, recurring-trip, and outbound
  webhook jobs.
- `WEBHOOK_ENCRYPTION_KEY`: encrypts enterprise outbound webhook signing
  secrets. If omitted, `AUTH_SECRET` is used.
- `NEXT_PUBLIC_BASE_URL`: used for the checkout return URL.

Configure Paystack to send events to:

```text
/api/billing/paystack/webhook
```

The webhook handles both `ps_sub_` platform subscriptions and the existing
`kd_` known-driver payments. Production requests without a valid Paystack
HMAC-SHA512 signature are rejected.

## Publishing paid plans

1. Open **Super Admin → Payment plans**.
2. Set the monthly price in kobo. Saving a new price creates a versioned
   Paystack plan and leaves existing subscribers on their old price.
3. Review the typed entitlement JSON. Unknown keys are rejected.
4. Make the plan public only when every advertised feature is ready.
5. Open checkout only after the active price has a Paystack plan code.

Free Family and Free School are provisioned automatically. Enforcement starts
in shadow mode for new family and school accounts. Use the super-admin billing
account endpoint to enable blocking after reviewing the logs:

```text
PATCH /api/admin/billing-accounts/:id
{
  "enforcementEnabled": true,
  "rolloutFlags": { "cohort": "general-availability" }
}
```

Limits block new records only. Downgrades never delete records, and safety
features do not use entitlement checks.

## Scheduled jobs

Vercel is configured to call:

- `/api/cron-jobs/subscriptions` hourly
- `/api/cron-jobs/trip-templates` every 15 minutes
- `/api/cron-jobs/outbound-webhooks` every 5 minutes

All production cron calls must include `Authorization: Bearer $CRON_SECRET`.

## Verification

```bash
npm run test:subscriptions
npm run typecheck
npm run build
```

The project requires Node 20 or newer for the production build.
