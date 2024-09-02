// // components/SubscribeButton.js
// import { toast } from '@/components/ui/use-toast';
// import { generateUserHmac } from '@/lib/generateHmac';

// const MAGICBELL_API_KEY = "b5ad8d7c5bbc6dccaceade3a242d4bc35c4dc665"
// const MAGICBELL_API_SECRET = "G2Qamc6GT49fHX72jxiS5mPRZ+aVrRj6X/CXkutw";
// const MAGICBELL_API_URL = "https://api.magicbell.io";



// export const SubscribeButton = (userEmail: string | any, userId: string | any) => {
   

//     const subscribeToPushNotifications = async () => {
//         try {
//             // Register the service worker before subscribing
//             const registration = await navigator.serviceWorker.register('/sw.js');
//             console.log('Service Worker registered with scope:', registration.scope);

//             // Subscribe using the MagicBell client
//             const subscription = await client.subscribe();
//             console.log('User subscribed successfully', subscription);
//         } catch (error) {
//             console.error('Subscription failed', error);
//             alert('Failed to subscribe to notifications. Please try again.');
//         }
//     };

//     const handleSubscription = async () => {
//         //check of notification popup has been granted
//         if (Notification.permission === "granted") {
//             await subscribeToPushNotifications()
//         } else if (Notification.permission === 'default') {
//             //request permission from the user
//             const permission = await Notification.requestPermission()

//             if (permission === 'granted') {
//                 await subscribeToPushNotifications();
//             } else {
//                 toast({
//                     title: "Notification Alert",
//                     description: "You need to enable notifications to subscribe."
//                 })
//                 console.log('Notifications permission denied');
//                 alert('You need to enable notifications to subscribe.');
//             }
//         } else {
//             console.log('Notifications have been blocked by the user');
//             alert('Notifications are blocked. Please enable them in your browser settings.');
//         }

//     };
//     return <button onClick={handleSubscription}>Enable Notification</button>;
// };



// export const UnSubscribeButton = (userEmail: string | any, userId: string | any) => {
//     const client = new WebPushClient({
//         apiKey: MAGICBELL_API_KEY,
//         userEmail: "abusomwansantos@gmail.com",
//         userHmac: generateUserHmac(userId),
//         serviceWorkerPath: '/sw.js',
//     });

//     const handleUnsubscription = async () => {
//         try {
//             const subscription = await client.unsubscribe();
//             console.log('User unsubscribed successfully', subscription);
//             toast({
//                 title: "Notification Alert",
//                 description: "User unsubscribed successfully"
//             })
//         } catch (error) {
//             console.error('Unsubscription failed', error);
//         }
//     };

//     return <button onClick={handleUnsubscription}>Disable Notification</button>;
// };


