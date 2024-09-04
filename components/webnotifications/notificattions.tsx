"use client";
import React, { useEffect, useState } from "react";
import { BellOff, BellRing } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { urlB64ToUint8Array } from "@/lib/utils";
import { saveSubscriptionToDatabase, removeNotification } from "@/actions/notification/helper";
import { useSession } from "next-auth/react";

export default function NotificationRequest() {
	const { data: session } = useSession();
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

		console.log(session?.user?.id, "session")
		try {
			const subscription = await registration.pushManager.subscribe(options);

			const subscriptionData = {
				endpoint: subscription.endpoint,
				keys: {
					p256dh: subscription.toJSON().keys.p256dh,
					auth: subscription.toJSON().keys.auth,
				},
			};
			// Call server action to save the subscription
			await saveSubscriptionToDatabase(subscriptionData, session?.user?.id!);

			queryClient.invalidateQueries({ queryKey: ["user"] });
		} catch (error) {
			toast({
				description: "Error during subscription creation: " + (error instanceof Error ? error.message : "Unknown error"),
			});
		}
	}

	async function handleRemoveNotification() {
		if (!session?.user?.id) return;

		const result = await removeNotification(session.user.id);

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
