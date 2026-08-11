"use client";

import { useEffect, useState } from "react";
import OneSignal from "react-onesignal";
import { Bell, Loader2 } from "lucide-react";

import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/use-toast";
import { canUseOneSignal } from "@/onesignal/utils";

import { SettingsToggleRow } from "./settings-rows";

export function PushNotificationToggle() {
  const [supported, setSupported] = useState(false);
  const [ready, setReady] = useState(false);
  const [optedIn, setOptedIn] = useState(false);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!canUseOneSignal()) {
      return;
    }
    setSupported(true);

    let cancelled = false;
    const sync = () => {
      if (cancelled) return;
      setOptedIn(Boolean(OneSignal.User?.PushSubscription?.optedIn));
      setReady(true);
    };

    let interval: ReturnType<typeof setInterval> | undefined;
    const waitForInit = () => {
      if ((window as any).OneSignalInitialized) {
        sync();
        OneSignal.User.PushSubscription.addEventListener("change", sync);
      } else {
        interval = setInterval(() => {
          if ((window as any).OneSignalInitialized) {
            clearInterval(interval);
            sync();
            OneSignal.User.PushSubscription.addEventListener("change", sync);
          }
        }, 300);
      }
    };
    waitForInit();

    return () => {
      cancelled = true;
      if (interval) clearInterval(interval);
      if ((window as any).OneSignalInitialized) {
        OneSignal.User.PushSubscription.removeEventListener("change", sync);
      }
    };
  }, []);

  const handleChange = async (next: boolean) => {
    setPending(true);
    try {
      if (next) {
        await OneSignal.User.PushSubscription.optIn();
      } else {
        await OneSignal.User.PushSubscription.optOut();
      }
      setOptedIn(next);
    } catch {
      toast({ description: "Unable to update notification settings.", variant: "destructive" });
    } finally {
      setPending(false);
    }
  };

  return (
    <SettingsToggleRow
      icon={<Bell className="h-4 w-4" aria-hidden="true" />}
      title="Push notifications"
      subtitle={supported ? "Get notified about ride requests and updates" : "Available in the installed PocketShuttle app"}
      control={
        pending ? (
          <Loader2 className="h-5 w-5 animate-spin text-slate-400" aria-hidden="true" />
        ) : (
          <Switch
            checked={optedIn}
            disabled={!supported || !ready}
            onCheckedChange={handleChange}
            className="data-[state=checked]:bg-emerald-500"
            aria-label="Toggle push notifications"
          />
        )
      }
    />
  );
}
