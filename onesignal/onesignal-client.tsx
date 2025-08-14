"use client";

import { useEffect } from 'react';
import OneSignal from 'react-onesignal';

export default function OneSignalClient({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        // Ensure this code runs only on the client side
        if (typeof window !== 'undefined') {
            OneSignal.init({
                appId: 'add2db83-a1f1-483c-821d-3bea98d1af6f',
                safari_web_id: "web.onesignal.auto.01b883ce-5cfa-4aca-8569-bf08de600615",
                // You can add other initialization options here
                notifyButton: {
                    enable: true,
                }
            });
        }
    }, []);

    return (
        <>{children}</>
    );
}