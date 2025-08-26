"use client";

import { useEffect } from 'react';
import OneSignal from 'react-onesignal';

export default function OneSignalClient({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        const initOneSignal = async () => {
            if ((window as any).OneSignalInitialized) return;

            try {
                await OneSignal.init({
                    // appId: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID || 'facc1574-ca01-42f2-b23f-d7596abe8643',
                    // safari_web_id: process.env.NEXT_PUBLIC_ONESIGNAL_SAFARI_WEB_ID || "web.onesignal.auto.69f4c26a-74c4-44a8-8df4-068c09b09538ç",
                    appId: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID || '94c38e89-e166-4578-b796-5f7dcdac4b16',
                    safari_web_id: process.env.NEXT_PUBLIC_ONESIGNAL_SAFARI_WEB_ID || "web.onesignal.auto.09714a24-a3bb-414f-8109-d75a4f07e6fa",
                    allowLocalhostAsSecureOrigin: true,
                    serviceWorkerParam: { scope: "/push/onesignal/" },
                    serviceWorkerPath: "push/onesignal/OneSignalSDKWorker.js",
                    //@ts-ignore
                    notifyButton: { enable: true }
                });

                (window as any).OneSignalInitialized = true; // mark as initialized
                console.log("OneSignal initialized successfully");
            } catch (error) {
                console.error("OneSignal initialization failed:", error);
            }
        };

        if (typeof window !== "undefined") {
            initOneSignal();
        }
    }, []);

    return <>{children}</>;
}



