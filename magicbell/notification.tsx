import { MagicBell, FloatingNotificationInbox } from '@magicbell/magicbell-react';

const MAGICBELL_API_URL = "https://api.magicbell.io";
export async function sendMagicBellNotification(email: string, title: string, content: string) {
    try {
        const response = await fetch(`${MAGICBELL_API_URL}/notifications`, {
            method: "POST",
            headers: {
                "X-MAGICBELL-API-KEY": MAGICBELL_API_KEY,
                "X-MAGICBELL-API-SECRET": MAGICBELL_API_SECRET,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                notification: {
                    title,
                    content,
                    recipients: [{ email }]
                }
            }),
        });

        if (!response.ok) {
            throw new Error(`Error sending notification: ${response.statusText}`);
        }
    } catch (error) {
        console.error("Error sending notification:", error);
    }
}
