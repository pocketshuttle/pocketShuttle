// import { clientSettings } from "@magicbell/react-headless"
// const MAGICBELL_API_KEY = "b5ad8d7c5bbc6dccaceade3a242d4bc35c4dc665";
// const MAGICBELL_API_SECRET = "G2Qamc6GT49fHX72jxiS5mPRZ+aVrRj6X/CXkutw";
// const MAGICBELL_API_URL = "https://api.magicbell.com";


// function getUserId() {
//     return clientSettings.getState().userExternalId as string
// }
// export async function sendMagicBellNotification(
//     email: string,
//     title: string,
//     content: string,
//     userId?: string
// ): Promise<void> {
//     console.log(getUserId(), "this is the user Id")

//     try {
//         const response = await fetch(`${MAGICBELL_API_URL}/notifications`, {
//             method: "POST",
//             headers: {
//                 "X-MAGICBELL-API-KEY": MAGICBELL_API_KEY,
//                 "X-MAGICBELL-API-SECRET": MAGICBELL_API_SECRET,
//                 "Content-Type": "application/json",
//             },
//             body: JSON.stringify({
//                 notification: {
//                     title,
//                     content,
//                     recipients: [{ email }],
//                     ...(userId && { userId }),
//                 },
//             }),
//         });

//         if (!response.ok) {
//             const errorText = await response.text();
//             throw new Error(`Error sending notification: ${response.status} - ${errorText}`);
//         }


//         console.log(`Notification sent successfully to ${email} with title: ${title}`);
//     } catch (error) {
//         console.error("Error sending notification:", error);
//     }
// }
