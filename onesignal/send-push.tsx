export async function sendPushNotification(message: string, userId: string) {
    try {
        const url = "https://api.onesignal.com/notifications?c=push";
        const ONE_SIGNAL_APP_ID = process.env.NEXT_PUBLIC_APP_ID!;
        const ONE_SIGNAL_REST_KEY = process.env.ONE_SIGNAL!;

        if (!ONE_SIGNAL_APP_ID || !ONE_SIGNAL_REST_KEY) {
            throw new Error("OneSignal configuration missing");
        }

        const response = await fetch(url, {
            method: "POST",
            headers: {
                Authorization: `Key ${ONE_SIGNAL_REST_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                app_id: ONE_SIGNAL_APP_ID,
                target_channel: "push",
                excluded_segments: [],
                headings: { en: "PocketShuttle" },
                contents: { en: message },
                include_aliases: {
                    external_id: [userId],
                },
                data: { foo: "bar" },
                ios_badgeType: "Increase",
                ios_badgeCount: 1,
                ios_attachments: {
                    id: "https://app.pocketshuttle.com/icon-256x256.png",
                },
                big_picture: "https://app.pocketshuttle.com/icon-256x256.png",
                huawei_category: "MARKETING",
                huawei_msg_type: "message",
                huawei_big_picture: "https://app.pocketshuttle.com/icon-256x256.png",
                priority: 10,
                ios_interruption_level: "active",
                ttl: 259200,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("OneSignal API error:", errorText);
            throw new Error(`OneSignal API error: ${errorText}`);
        }

        const data = await response.json();
        console.log("✅ Push notification sent:", data);
        return data;
    } catch (error) {
        console.error("❌ Error sending push notification:", error);
        throw error;
    }
}
