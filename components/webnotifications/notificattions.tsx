"use client";
import React, { useEffect, useState } from "react";
import { BellOff, BellRing } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { urlB64ToUint8Array } from "@/lib/utils";
import { saveSubscriptionToDatabase, removeNotification } from "@/actions/notification/helper";
import { useSession } from "@/hooks/useSession";

export default function NotificationRequest() {
	const session = useSession();
	const queryClient = useQueryClient();
	const [notificationPermission, setNotificationPermission] = useState<"granted" | "denied" | "default">(
		"default"
	);

	const showNotification = () => {
		if ("Notification" in window) {
			Notification.requestPermission().then((permission) => {
				setNotificationPermission(permission);
				if (permission === "granted") {
					subscribeUser();
				} else {
					toast({
						description: "Please go to settings and enable notifications.",
					});
				}
			});
		} else {
			toast({
				description: "This browser does not support notifications.",
			});
		}
	};

	async function subscribeUser() {
		if ("serviceWorker" in navigator) {
			try {
				if (process.env.NODE_ENV === "development") {
					toast({
						description: "Push notifications are disabled in development.",
					});
					return;
				}

				const registration = await navigator.serviceWorker.getRegistration();
				if (registration) {
					await generateSubscribeEndPoint(registration);
				} else {
					const newRegistration = await navigator.serviceWorker.register("/sw.js");
					await generateSubscribeEndPoint(newRegistration);
				}
			} catch (error) {
				toast({
					description: "Error during service worker registration or subscription.",
				});
			}
		} else {
			toast({
				description: "Service workers are not supported in this browser",
			});
		}
	}

	async function generateSubscribeEndPoint(registration: ServiceWorkerRegistration) {
		const applicationServerKey = urlB64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_KEY!);
		const options = {
			applicationServerKey,
			userVisibleOnly: true,
		};

		// console.log(session?.user?.id, "session")
		try {
			// @ts-ignore
			const subscription = await registration.pushManager.subscribe(options);

			const subscriptionData = {
				endpoint: subscription.endpoint,
				keys: {
					//  @ts-ignore 
					p256dh: subscription.toJSON().keys.p256dh,
					//  @ts-ignore 
					auth: subscription.toJSON().keys.auth,
				},
			};
			// Call server action to save the subscription
			await saveSubscriptionToDatabase(subscriptionData, session.id!);

			queryClient.invalidateQueries({ queryKey: ["user"] });
		} catch (error) {
			toast({
				description: "Error during subscription creation: " + (error instanceof Error ? error.message : "Unknown error"),
			});
		}
	}

	async function handleRemoveNotification() {
		if (!session.id) return;

		const result = await removeNotification(session.id);

		if (result.error) {
			toast({
				description: "Error removing subscription: " + result.error,
			});
		} else {
			setNotificationPermission("denied");
			queryClient.invalidateQueries({ queryKey: ["user"] });
		}
	}

	useEffect(() => {
		if (process.env.NODE_ENV === "development" && "serviceWorker" in navigator) {
			navigator.serviceWorker.getRegistrations().then((registrations) => {
				registrations.forEach((registration) => registration.unregister());
			});

			caches.keys().then((cacheNames) => {
				cacheNames.forEach((cacheName) => caches.delete(cacheName));
			});
		}

		setNotificationPermission(Notification.permission);
	}, []);

	return (
		<div className="hover:scale-110 cursor-pointer transition-all">
			{notificationPermission === "granted" ? (
				<BellRing onClick={handleRemoveNotification} />
			) : (
				<BellOff onClick={showNotification} />
			)}
		</div>
	);
}
