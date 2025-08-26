export async function sendPushNotification(message: string) {
    try {
        const response = await fetch("/api/send-push", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ message }),
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("Push failed:", data.error || data);
            throw new Error(data.error || "Failed to send push notification");
        }

        console.log("✅ Push notification sent:", data);
        return data;
    } catch (error) {
        console.error(" Error sending push notification:", error);
        throw error;
    }
}
