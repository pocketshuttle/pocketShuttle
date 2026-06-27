"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Clock3 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";

type TicketStatus = "PENDING" | "FIXED";

type SupportTicketControlsProps = {
  ticketId: string;
  initialStatus: TicketStatus;
};

export function SupportTicketControls({ ticketId, initialStatus }: SupportTicketControlsProps) {
  const [status, setStatus] = useState<TicketStatus>(initialStatus);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const updateStatus = (nextStatus: TicketStatus) => {
    if (
      nextStatus === "FIXED" &&
      !window.confirm("Have you confirmed with the parents that this issue is resolved? Marking it fixed will move this ticket to 21-day deleted history.")
    ) {
      return;
    }

    startTransition(async () => {
      try {
        const response = await fetch(`/api/admin/support-tickets/${ticketId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: nextStatus }),
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data?.message || "Unable to update ticket.");
        if (data?.deleted) {
          toast({ description: data?.message || "Ticket fixed and moved to history." });
          router.refresh();
          return;
        }
        setStatus(nextStatus);
        toast({ description: data?.message || "Support ticket updated." });
      } catch (error) {
        toast({
          description: error instanceof Error ? error.message : "Unable to update ticket.",
          variant: "destructive",
        });
      }
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${status === "FIXED" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
        {status === "FIXED" ? <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" /> : <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />}
        {status}
      </span>
      <Button
        type="button"
        size="sm"
        variant={status === "FIXED" ? "outline" : "default"}
        disabled={isPending || status === "FIXED"}
        onClick={() => updateStatus("FIXED")}
        className="gap-2"
      >
        <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
        Mark fixed
      </Button>
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={isPending || status === "PENDING"}
        onClick={() => updateStatus("PENDING")}
        className="gap-2"
      >
        <Clock3 className="h-4 w-4" aria-hidden="true" />
        Pending
      </Button>
    </div>
  );
}
