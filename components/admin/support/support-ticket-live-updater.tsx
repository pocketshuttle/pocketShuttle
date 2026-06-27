"use client";

import { useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";

export function SupportTicketLiveUpdater() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState === "hidden" || isPending) return;
      startTransition(() => {
        router.refresh();
      });
    };
    const intervalId = window.setInterval(refresh, 10000);

    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [isPending, router]);

  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
      <span className="h-2 w-2 rounded-full bg-emerald-500" />
      {isPending ? "Syncing" : "Live"}
    </span>
  );
}
