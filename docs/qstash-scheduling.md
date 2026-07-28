# QStash scheduling

PocketShuttle uses QStash for recurring production work so the web application
can remain on Vercel Hobby. QStash calls six authenticated `GET` endpoints; all
cron expressions are evaluated in UTC.

## Schedules

| Job | Schedule | QStash retries |
| --- | --- | ---: |
| Reset student day state | `45 2 * * *` | 3 |
| Move in-bus students to school | `0 9 * * *` | 3 |
| Reconcile subscription access | `15 * * * *` | 0 |
| Generate recurring trips | `*/15 * * * *` | 0 |
| Deliver pending organization webhooks | `*/5 * * * *` | 0 |
| Delete expired soft-deleted support tickets | `20 3 * * *` | 3 |

Frequent jobs rely on their next scheduled run instead of an immediate QStash
retry. Their database work already retains pending or due records for the next
run. Daily jobs use retries because their updates and deletions are idempotent.

## Runtime configuration

Set these variables on the Vercel deployment:

- `QSTASH_CURRENT_SIGNING_KEY`
- `QSTASH_NEXT_SIGNING_KEY`
- `CRON_SECRET`

Scheduled calls are authenticated with the `Upstash-Signature` header.
`CRON_SECRET` is a separate recovery credential for operators and is never
stored in QStash. Production calls fail closed when neither credential is
valid.

The schedule-management commands require these operator-only variables:

- `QSTASH_TOKEN`
- `QSTASH_DESTINATION_BASE_URL`, such as the staging or production HTTPS origin
- `QSTASH_SCHEDULE_PREFIX`, such as `pocketshuttle-staging` or
  `pocketshuttle-production`

Do not add operator credentials to committed environment files or print them in
logs.

## Provisioning and verification

1. Deploy the cron routes and signing-key environment variables to an isolated
   staging deployment.
2. Export the three operator-only variables in the terminal session.
3. Create or update the six stable schedule IDs:

   ```bash
   npm run qstash:sync
   ```

4. Confirm every remote definition matches the repository and print each next
   run timestamp:

   ```bash
   npm run qstash:check
   ```

5. Inspect QStash delivery logs and confirm `2xx` responses and expected
   database changes for every job.
6. Remove the staging schedules, change the destination and prefix to the
   production values, then sync and check production:

   ```bash
   npm run qstash:remove
   npm run qstash:sync
   npm run qstash:check
   ```

The sync command upserts only PocketShuttle's six stable IDs. The remove
command deletes only those IDs and leaves unrelated QStash schedules intact.

## Manual recovery and rollback

An operator can run an individual job without QStash by calling its deployed
URL with the recovery secret:

```bash
curl --fail --show-error \
  --header "Authorization: Bearer $CRON_SECRET" \
  "https://app.example.com/api/cron-jobs/subscriptions"
```

To stop all automatic work, run `npm run qstash:remove` with the target
environment's prefix. Existing in-flight QStash messages may still complete;
verify the delivery log before manually rerunning a job.

## Credential rotation

- When QStash signing keys rotate, copy both the current and next keys from the
  QStash console into Vercel and redeploy before retiring an old key.
- Rotating `QSTASH_TOKEN` affects only schedule-management commands; update the
  operator environment before the next sync, check, or removal.
- Rotating `CRON_SECRET` affects only manual recovery calls and does not require
  recreating QStash schedules.
