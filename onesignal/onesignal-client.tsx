"use client";

import { useEffect } from 'react';
import OneSignal from 'react-onesignal';

export default function OneSignalClient({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        const initOneSignal = async () => {
            if ((window as any).OneSignalInitialized) return;

            try {
                await OneSignal.init({
                    //  appId: process.env.NEXT_PUBLIC_APP_ID! ,
                    // safari_web_id: process.env.NEXT_PUBLIC_SAFARI_ID,
                    appId: process.env.NEXT_PUBLIC_APP_ID!,
                    safari_web_id: process.env.NEXT_PUBLIC_SAFARI_ID,
                    allowLocalhostAsSecureOrigin: true,
                    serviceWorkerParam: { scope: "/push/onesignal/" },
                    serviceWorkerPath: "push/onesignal/OneSignalSDKWorker.js",
                    //@ts-ignore
                    notifyButton: { enable: true }
                });

                (window as any).OneSignalInitialized = true; // mark as initialized
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



