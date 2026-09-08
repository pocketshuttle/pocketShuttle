# PocketShuttle mobile app

The Expo React Native application lives in `apps/mobile` and supports parent,
driver, and teacher accounts. School operations remain in the web dashboard.
Android package ID: `com.pocketshuttle.app`.

## Requirements

- Node 20.19.4 or newer
- Android Studio or an Expo/EAS account
- A Google Maps Android SDK key
- PocketShuttle OneSignal and Pusher public application identifiers
- The web API deployed with `MOBILE_AUTH_SECRET` or `AUTH_SECRET`

Copy `apps/mobile/.env.example` to `apps/mobile/.env.local` and fill in:

- `EXPO_PUBLIC_API_URL`
- `EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_KEY`
- `EXPO_PUBLIC_ONESIGNAL_APP_ID`
- `EXPO_PUBLIC_PUSHER_KEY`
- `EXPO_PUBLIC_PUSHER_CLUSTER`
- `EXPO_PUBLIC_EAS_PROJECT_ID`

The OneSignal app ID must match the server-side `NEXT_PUBLIC_APP_ID`. Provider
REST keys and Pusher secrets remain server-only.

## Development

```bash
npm install
npm run mobile:typecheck
npm run mobile:start
```

Expo Go is not sufficient because background location, OneSignal, and Pusher
use native modules. Build a development client:

```bash
cd apps/mobile
npx eas-cli build --platform android --profile development
```

## Authentication and safety

Mobile access tokens last 15 minutes. Refresh tokens rotate, expire after 30
days, and are stored only as SHA-256 hashes on the server. Password changes,
account suspension, device revocation, and logout revoke the affected mobile
sessions.

Driver background location starts only after an authorized trip is started.
Android displays a persistent foreground-service notification. Tracking stops
when the trip completes, the driver logs out, device access is revoked, or
location permission is removed. Offline location and attendance events are
queued locally with client event IDs and replayed in timestamp order.

## Internal testing release

1. Run `eas init` from `apps/mobile` to populate the EAS project ID.
2. Configure secrets in EAS; do not commit `.env.local`,
   `google-services.json`, keystores, or service-account JSON.
3. Create the Android App Bundle:

   ```bash
   npx eas-cli build --platform android --profile internal
   ```

4. Link a Google Play service account and submit:

   ```bash
   npx eas-cli submit --platform android --profile internal
   ```

5. Add testers in the Google Play internal-testing track.

## Verification

```bash
npm run test:mobile
npm run mobile:typecheck
npm run typecheck
npm run test:admin
npm run test:subscriptions
```

Maestro flows are in `apps/mobile/.maestro`. Run them against an installed
development or internal build using environment-provided test credentials.
