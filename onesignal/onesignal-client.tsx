"use client";

import { useEffect } from "react";
import OneSignal from "react-onesignal";
import { canUseOneSignal } from "@/onesignal/utils";

export default function OneSignalClient({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const initOneSignal = async () => {
      if (!canUseOneSignal()) {
        return;
      }

      if ((window as any).OneSignalInitialized) {
        return;
      }

      if (!process.env.NEXT_PUBLIC_APP_ID) {
        console.warn("OneSignal skipped: NEXT_PUBLIC_APP_ID is not configured.");
        return;
      }

      try {
        await OneSignal.init({
          appId: process.env.NEXT_PUBLIC_APP_ID,
          safari_web_id: process.env.NEXT_PUBLIC_SAFARI_ID,
          allowLocalhostAsSecureOrigin: true,
          serviceWorkerParam: { scope: "/push/onesignal/" },
          serviceWorkerPath: "push/onesignal/OneSignalSDKWorker.js",
          notifyButton: { enable: true } as any,
        });

        (window as any).OneSignalInitialized = true;
      } catch (error) {
        console.error("OneSignal initialization failed:", error);
      }
    };

    void initOneSignal();
  }, []);

  return <>{children}</>;
}
