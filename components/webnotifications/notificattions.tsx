"use client";
import { urlB64ToUint8Array } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { BellOff, BellRing } from "lucide-react";
import React, { useEffect, useState } from "react";
import { toast } from "@/components/ui/use-toast";
import { db } from "@/lib/db";
import { useSession } from "next-auth/react";
import { generateSubscribeEndPoint, removeNotification } from "@/actions/notification/helper";

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

	const handleRemoveNotification = async () => {
		setNotificationPermission("denied");
		if (!userId) return;

		const result = await removeNotification(userId);

		if (result.error) {
			toast({
				description: "Error removing subscription: " + result.error,
			});
		} else {
			queryClient.invalidateQueries({ queryKey: ["user"] });
		}
	};


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
