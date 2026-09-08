import { OneSignal } from "react-native-onesignal";

import { apiRequest } from "../api/client";
import type { MobileActor } from "../types";

let initialized = false;

export async function initializeMobileNotifications(actor: MobileActor) {
  const appId = process.env.EXPO_PUBLIC_ONESIGNAL_APP_ID;
  if (!appId) return;
  if (!initialized) {
    OneSignal.initialize(appId);
    initialized = true;
  }
  OneSignal.login(actor.id);
  await OneSignal.Notifications.requestPermission(false);
  const subscriptionId =
    await OneSignal.User.pushSubscription.getIdAsync();
  if (subscriptionId) {
    await apiRequest("/api/mobile/devices", {
      method: "POST",
      body: JSON.stringify({
        oneSignalSubscriptionId: subscriptionId,
        appVersion: "0.1.0",
      }),
    }).catch(() => undefined);
  }
}

export async function unregisterMobileNotifications() {
  if (!initialized) return;
  OneSignal.logout();
}
