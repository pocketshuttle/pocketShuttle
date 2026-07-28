"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Clock3, Shield } from "lucide-react";

import { Button } from "@/components/ui/button";

export function ManagedWorkspaceBanner({
  actorName,
  subjectName,
  reason,
  expiresAt,
}: {
  actorName: string;
  subjectName: string;
  reason: string;
  expiresAt: string;
}) {
  const [remaining, setRemaining] = useState(() =>
    Math.max(0, new Date(expiresAt).getTime() - Date.now())
  );
  const [pending, setPending] = useState(false);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setRemaining(Math.max(0, new Date(expiresAt).getTime() - Date.now()));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [expiresAt]);

  const remainingLabel = useMemo(() => {
    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    return `${minutes}:${String(seconds).padStart(2, "0")}`;
  }, [remaining]);

  const closeWorkspace = async () => {
    setPending(true);
    const response = await fetch("/api/admin/workspaces/current", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
    });
    const data = await response.json().catch(() => ({}));
    window.location.assign(data.redirectUrl || "/admin/login");
  };

  return (
    <div className="sticky top-0 z-[100] flex flex-wrap items-center justify-between gap-3 border-b border-amber-300 bg-amber-100 px-4 py-2 text-sm text-amber-950 shadow-sm">
      <div className="flex min-w-0 items-center gap-2">
        <Shield className="h-4 w-4 shrink-0" />
        <p className="truncate">
          <strong>{actorName}</strong> is managing <strong>{subjectName}</strong> ·{" "}
          {reason.replaceAll("_", " ").toLowerCase()}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <span className="flex items-center gap-1 font-mono text-xs">
          <Clock3 className="h-3.5 w-3.5" /> {remainingLabel}
        </span>
        <Button
          size="sm"
          variant="outline"
          disabled={pending}
          onClick={closeWorkspace}
          className="h-8 gap-2 border-amber-400 bg-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Return to admin
        </Button>
      </div>
    </div>
  );
}
