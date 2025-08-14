"use client";

import { useEffect } from 'react';
import OneSignal from 'react-onesignal';


export default function OneSignalClient({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        const initOneSignal = async () => {
            try {
                await OneSignal.init({
                    appId: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID || 'add2db83-a1f1-483c-821d-3bea98d1af6f',
                    safari_web_id: process.env.NEXT_PUBLIC_ONESIGNAL_SAFARI_WEB_ID || "web.onesignal.auto.01b883ce-5cfa-4aca-8569-bf08de600615",
                    allowLocalhostAsSecureOrigin: true,
                    serviceWorkerPath: "/OneSignalSDKWorker.js",
                    serviceWorkerParam: { scope: "/" },
                    notifyButton: {
                        enable: true,
                        prenotify: true,
                        showCredit: false,
                        text: {
                            'tip.state.unsubscribed': 'Subscribe to notifications',
                            'tip.state.subscribed': 'You are subscribed to notifications',
                            'tip.state.blocked': 'You have blocked notifications',
                            'message.prenotify': 'Click to subscribe to notifications',
                            'message.action.subscribing': 'Subscribing...',
                            'message.action.subscribed': 'Thanks for subscribing!',
                            'message.action.resubscribed': 'You are now subscribed to notifications',
                            'message.action.unsubscribed': 'You will no longer receive notifications',
                            'dialog.main.title': 'Manage your notification preferences',
                            'dialog.main.button.subscribe': 'SUBSCRIBE',
                            'dialog.main.button.unsubscribe': 'UNSUBSCRIBE',
                            'dialog.blocked.title': 'Unblock Notifications',
                            'dialog.blocked.message': 'Follow these instructions to allow notifications:'
                        }
                    }
                });

                console.log('OneSignal initialized successfully');
            } catch (error) {
                console.error('OneSignal initialization failed:', error);
            }
        };

        if (typeof window !== 'undefined') {
            initOneSignal();
        }
    }, []);

    return <>{children}</>;
}