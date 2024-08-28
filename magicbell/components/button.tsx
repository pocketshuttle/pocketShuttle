// components/SubscribeButton.js
import { WebPushClient } from '@magicbell/webpush';

const MAGICBELL_API_KEY = "b5ad8d7c5bbc6dccaceade3a242d4bc35c4dc665";
const MAGICBELL_API_SECRET = "G2Qamc6GT49fHX72jxiS5mPRZ+aVrRj6X/CXkutw";
const MAGICBELL_API_URL = "https://api.magicbell.io";



const SubscribeButton = (userEmail: string | any, userId: string | any) => {
    const client = new WebPushClient({
        apiKey: MAGICBELL_API_KEY,
        userEmail: "abusomwansantos@gmail.com",
        userHmac: userId,
        serviceWorkerPath: '/sw.js',
    });
    const handleSubscription = () => {
        client.subscribe().then((subscription) => {
            console.log('User subscribed successfully', subscription);
        }).catch((error) => {
            console.error('Subscription failed', error);
        });
    };

    return <button onClick={handleSubscription}>Enable Notification</button>;
};

export default SubscribeButton;
