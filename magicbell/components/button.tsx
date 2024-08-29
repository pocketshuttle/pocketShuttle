// components/SubscribeButton.js
import { generateUserHmac } from '@/lib/generateHmac';
import { WebPushClient } from '@magicbell/webpush';

const MAGICBELL_API_KEY = process.env.MAGICBELL_API_SECRET;

// if (!MAGICBELL_API_KEY) {
//     throw new Error("MAGICBELL_API_SECRET environment variable is not set.");
// }
const MAGICBELL_API_SECRET = "G2Qamc6GT49fHX72jxiS5mPRZ+aVrRj6X/CXkutw";
const MAGICBELL_API_URL = "https://api.magicbell.io";



export const SubscribeButton = (userEmail: string | any, userId: string | any) => {
    const client = new WebPushClient({
        apiKey: process.env.MAGICBELL_API_SECRET,
        userEmail: "abusomwansantos@gmail.com",
        userHmac: generateUserHmac(userId),
        serviceWorkerPath: '/sw.js',
    });
    const handleSubscription = async () => {
        try {
            const subscription = await client.subscribe();
            console.log('User subscribed successfully', subscription);
        } catch (error) {
            console.error('Subscription failed', error);
        }
    };

    return <button onClick={handleSubscription}>Enable Notification</button>;
};
export const UnSubscribeButton = (userEmail: string | any, userId: string | any) => {
    const client = new WebPushClient({
        apiKey: MAGICBELL_API_KEY,
        userEmail: "abusomwansantos@gmail.com",
        userHmac: generateUserHmac(userId),
        serviceWorkerPath: '/sw.js',
    });
    const handleUnsubscription = async () => {
        try {
            const subscription = await client.unsubscribe();
            console.log('User unsubscribed successfully', subscription);
        } catch (error) {
            console.error('Unsubscription failed', error);
        }
    };

    return <button onClick={handleUnsubscription}>Disable Notification</button>;
};


