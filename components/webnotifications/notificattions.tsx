"use client";
import { urlB64ToUint8Array } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { BellOff, BellRing } from "lucide-react";
import React, { useEffect, useState } from "react";
import { toast } from "@/components/ui/use-toast";
import { db } from "@/lib/db";
import { useSession } from "next-auth/react";

export default function NotificationRequest() {
	const { data: session } = useSession();
	const userId = session?.user?.id; // Use session to get the current user's ID

	const queryClient = useQueryClient();
	const [notificationPermission, setNotificationPermission] = useState<
		"granted" | "denied" | "default"
	>("granted");

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
					generateSubscribeEndPoint(registration);
				} else {
					const newRegistration = await navigator.serviceWorker.register("/sw.js");
					generateSubscribeEndPoint(newRegistration);
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

	const generateSubscribeEndPoint = async (newRegistration: ServiceWorkerRegistration) => {
		const applicationServerKey = urlB64ToUint8Array(
			process.env.NEXT_PUBLIC_VAPID_KEY!
		);
		const options = {
			applicationServerKey,
			userVisibleOnly: true,
		};
		const subscription = await newRegistration.pushManager.subscribe(options);

		try {
			// Store the subscription in the database
			const notification = await db.notification.create({
				data: {
					notificationJson: JSON.stringify(subscription),
				},
			});

			// Create the association in the join table
			await db.parentNotification.create({
				data: {
					parentId: userId!, // Use current user's ID
					notificationId: notification.id,
				},
			});

			queryClient.invalidateQueries({ queryKey: ["user"] });
		} catch (error) {

			toast({
				description: "Error storing subscription: " + (error instanceof Error ? error.message : "Unknown error"),
			});
		}
	};

	const removeNotification = async () => {
		setNotificationPermission("denied");

		try {
			// Remove notifications and associations from the database
			await db.parentNotification.deleteMany({
				where: {
					parentId: userId!,
				},
			});

			await db.notification.deleteMany({
				where: {
					parents: {
						every: {
							parentId: userId!,
						},
					},
				},
			});

			queryClient.invalidateQueries({ queryKey: ["user"] });
		} catch (error) {
			console.log(error);
			toast({
				description: "Error removing subscription: " + (error instanceof Error ? error.message : "Unknown error"),
			});
		}
	};

	useEffect(() => {
		setNotificationPermission(Notification.permission);
	}, []);

	return (
		<div className="hover:scale-110 cursor-pointer transition-all">
			{notificationPermission === "granted" ? (
				<BellRing onClick={removeNotification} />
			) : (
				<BellOff onClick={showNotification} />
			)}
		</div>
	);
}
