"use client";

import { useTransition } from "react";
import { RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";

type EventRow = {
  id: string;
  eventType: string;
  timestamp: string;
  payload?: unknown;
  trip: { id: string; title: string };
};

export function NotificationMonitor({ events }: { events: EventRow[] }) {
  const [isPending, startTransition] = useTransition();

  const resend = (event: EventRow) => {
    const reason = window.prompt("Required resend reason", "Customer notification retry");
    if (!reason) return;
    startTransition(async () => {
      try {
        const response = await fetch("/api/admin/notifications", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ eventId: event.id, reason }),
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.message || "Unable to resend");
        const failed = (data.attempts || []).filter(
          (attempt: { status: string }) => attempt.status === "failed"
        ).length;
        toast({
          description: `${data.message}. ${(data.attempts || []).length} attempts, ${failed} failed.`,
        });
      } catch (error) {
        toast({
          description: error instanceof Error ? error.message : "Unable to resend",
          variant: "destructive",
        });
      }
    });
  };

  return (
    <div className="grid gap-2">
      {events.map((event) => (
        <div
          key={event.id}
          className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 md:flex-row md:items-center md:justify-between"
        >
          <div>
            <p className="font-medium">
              {event.eventType.replaceAll("_", " ")} · {event.trip.title}
            </p>
            <p className="text-xs text-slate-500">
              {new Date(event.timestamp).toLocaleString()} · trip {event.trip.id}
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            disabled={isPending}
            onClick={() => resend(event)}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" /> Resend
          </Button>
        </div>
      ))}
      {!events.length ? (
        <p className="rounded-lg border bg-white p-4 text-sm text-slate-500">
          No notification-capable trip events.
        </p>
      ) : null}
    </div>
  );
}
