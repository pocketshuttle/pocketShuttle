export async function sendPushNotification(message: string) {
    try {
        const response = await fetch('/api/send-push', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message }),
        });

        if (!response.ok) {
            console.error('Failed to send push notification:', response.statusText);
            throw new Error('Failed to send push notification')
        }

        const data = await response.json();
        console.log('Push notification sent successfully:', data);
    } catch (error) {
        console.error('Error sending push notification:', error);
    }
}