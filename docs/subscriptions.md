# PocketShuttle subscriptions

PocketShuttle resolves all paid access through a billing account. A billing
account belongs to a standalone family, a school, or an enterprise
organization. Known-driver assignment payments remain separate.

## Runtime configuration

Configure these server-side environment variables:

- `PAYSTACK_SECRET_KEY`: creates Paystack plans, initializes recurring checkout,
  verifies webhook signatures, and opens hosted subscription management. Test
  keys may use only TEST references and live keys may use only LIVE references.
- `CRON_SECRET`: protects subscription expiry, recurring-trip, and outbound
  webhook jobs when an operator invokes them manually.
- `QSTASH_CURRENT_SIGNING_KEY` and `QSTASH_NEXT_SIGNING_KEY`: verify that
  scheduled calls came from QStash.
- `WEBHOOK_ENCRYPTION_KEY`: encrypts enterprise outbound webhook signing
  secrets. If omitted, `AUTH_SECRET` is used.
- `NEXT_PUBLIC_BASE_URL`: used for the checkout return URL.
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_SMS_FROM`, and
  `TWILIO_WHATSAPP_FROM`: optional premium-channel delivery configuration.

Configure Paystack to send events to:

```text
/api/billing/paystack/webhook
```

The webhook handles both `ps_sub_` platform subscriptions and the existing
`kd_` known-driver payments. Production requests without a valid Paystack
HMAC-SHA512 signature are rejected.

Configure Twilio to send signed delivery status callbacks to
`/api/notifications/twilio/status`. Premium quota is recorded after provider
acceptance and released if a callback later reports a failed delivery.

## Publishing paid plans

1. Open **Super Admin → Payment plans**.
2. Set the monthly price in kobo. Saving a new price creates a versioned
   Paystack plan in the environment selected by the deployed key and leaves
   existing subscribers on their old price.
3. Review the typed entitlement JSON. Unknown keys are rejected.
4. Make the plan public only when every advertised feature is ready.
5. Inspect TEST and LIVE synchronization separately. Open checkout only after
   the active price has a reference for the current environment.

Prices saved before Paystack is configured remain valid local price versions.
After adding `PAYSTACK_SECRET_KEY`, opening checkout from the super-admin plan
screen synchronizes an unsynchronized active price with Paystack automatically.

Free Family and Free School are provisioned automatically. Family accounts
enforce their current plan limits immediately; School accounts continue to
start in shadow mode. Use the super-admin billing account endpoint to change
enforcement for an individual account when an audited support exception is
required:

```text
PATCH /api/admin/billing-accounts/:id
{
  "enforcementEnabled": true,
  "rolloutFlags": {
    "paidCheckout": true,
    "cohort": "family-sandbox-pilot"
  }
}
```

`paidCheckout` defaults to false and is the authoritative checkout gate. The
cohort label is audited metadata and does not grant access by itself. Accounts
outside an approved cohort receive `403 ROLLOUT_NOT_ENABLED`.

Limits block new records and reactivated relationships only. Existing records
remain available after enforcement or a downgrade, and safety features do not
use entitlement checks. Pending and approved family driver connections consume
driver slots; a registration email by itself does not.

## Pro workspaces

- Standalone parents manage places, recurring trips, viewer invitations,
  reports, premium notification consent, and delivery usage at `/parent/pro`.
- Schools manage assignments, verification, fixed roles, notification
  policies, analytics, CSV jobs, and entitled exports at `/dashboard/pro`.
- School Pro remains hidden and non-purchasable until its sandbox school passes
  every advertised workflow.

## Pilot promotion checklist

Promote a cohort only after:

1. The production callback base URL and `CRON_SECRET` are configured.
2. The current provider environment shows a synchronized active price.
3. Checkout, renewal, failed renewal, three-day grace, recovery, cancellation,
   and free fallback pass in that environment.
4. Signature failures, duplicate webhooks, cron failures, and delivery failures
   are visible in production monitoring.
5. Emergency alerts, active-trip location, pickup/drop-off confirmation,
   revocation, and critical push alerts pass in every subscription state.

Use cohorts in this order: Family sandbox, Family invited live, School sandbox,
School invited live, then Family and School general availability. Never copy a
TEST provider plan code into a LIVE reference.

## Scheduled jobs

QStash is configured to call:

- `/api/cron-jobs/subscriptions` hourly
- `/api/cron-jobs/trip-templates` every 15 minutes
- `/api/cron-jobs/outbound-webhooks` every 5 minutes
- `/api/cron-jobs/support-retention` daily
- `/api/cron-jobs/reset-student` daily
- `/api/cron-jobs/reset-status` daily

QStash calls must have a valid `Upstash-Signature`. Operators can still invoke
a job with `Authorization: Bearer $CRON_SECRET`. See
[`docs/qstash-scheduling.md`](./qstash-scheduling.md) for provisioning,
verification, credential rotation, and rollback.

## Verification

```bash
npm run test:subscriptions
npm run typecheck
npm run build
```

The project requires Node 20 or newer for the production build.
