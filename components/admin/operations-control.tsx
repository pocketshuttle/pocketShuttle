"use client";

import { useState, useTransition } from "react";
import { AlertTriangle, MapPin, Pause, Play, ShieldCheck, Square } from "lucide-react";

import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";

type TripRow = {
  id: string;
  title: string;
  tripType: string;
  status: string;
  safetyState: string;
  driverId?: string | null;
  vehicleId?: string | null;
  updatedAt: string;
  locations: Array<{ lat: number; lng: number; speed?: number | null; timestamp: string }>;
  _count: { participants: number; viewers: number; events: number };
};

export function OperationsControl({ initialTrips }: { initialTrips: TripRow[] }) {
  const [trips, setTrips] = useState(initialTrips);
  const [isPending, startTransition] = useTransition();

  const updateTrip = (trip: TripRow, action: string) => {
    const reason = window.prompt(`Reason for ${action.toLowerCase()}`, "Platform operations correction");
    if (!reason) return;
    startTransition(async () => {
      try {
        const response = await fetch(`/api/admin/operations/trips/${trip.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, reason }),
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.message || "Unable to update trip");
        setTrips((current) =>
          current.map((row) => (row.id === trip.id ? { ...row, ...data.trip } : row))
        );
        toast({ description: data.message });
      } catch (error) {
        toast({
          description: error instanceof Error ? error.message : "Unable to update trip",
          variant: "destructive",
        });
      }
    });
  };

  return (
    <div className="grid gap-3">
      {trips.map((trip) => {
        const location = trip.locations[0];
        return (
          <article key={trip.id} className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-semibold">{trip.title}</h2>
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-xs">{trip.status}</span>
                  <span
                    className={`rounded-full px-2 py-1 text-xs ${
                      trip.safetyState === "normal"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-rose-50 text-rose-700"
                    }`}
                  >
                    {trip.safetyState}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  {trip.tripType} · driver {trip.driverId || "unassigned"} · vehicle{" "}
                  {trip.vehicleId || "unassigned"}
                </p>
                <p className="mt-2 text-sm text-slate-600">
                  {trip._count.participants} participants · {trip._count.viewers} viewers ·{" "}
                  {trip._count.events} events
                </p>
                {location ? (
                  <a
                    className="mt-2 inline-flex items-center gap-1 text-sm text-blue-600"
                    href={`https://www.google.com/maps?q=${location.lat},${location.lng}`}
                    target="_blank"
                  >
                    <MapPin className="h-4 w-4" /> {location.lat.toFixed(5)},{" "}
                    {location.lng.toFixed(5)}
                  </a>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-2">
                {trip.status === "active" ? (
                  <Button size="sm" variant="outline" disabled={isPending} onClick={() => updateTrip(trip, "PAUSE")} className="gap-2">
                    <Pause className="h-4 w-4" /> Pause
                  </Button>
                ) : null}
                {trip.status === "paused" ? (
                  <Button size="sm" variant="outline" disabled={isPending} onClick={() => updateTrip(trip, "RESUME")} className="gap-2">
                    <Play className="h-4 w-4" /> Resume
                  </Button>
                ) : null}
                {trip.safetyState === "emergency" || trip.status === "emergency" ? (
                  <Button size="sm" variant="outline" disabled={isPending} onClick={() => updateTrip(trip, "RESOLVE_EMERGENCY")} className="gap-2">
                    <ShieldCheck className="h-4 w-4" /> Resolve
                  </Button>
                ) : null}
                {["active", "paused"].includes(trip.status) ? (
                  <Button size="sm" variant="outline" disabled={isPending} onClick={() => updateTrip(trip, "COMPLETE")} className="gap-2">
                    <Square className="h-4 w-4" /> Complete
                  </Button>
                ) : null}
                {["scheduled", "active", "paused", "emergency"].includes(trip.status) ? (
                  <Button size="sm" variant="outline" disabled={isPending} onClick={() => updateTrip(trip, "CANCEL")} className="gap-2 text-rose-700">
                    <AlertTriangle className="h-4 w-4" /> Cancel
                  </Button>
                ) : null}
              </div>
            </div>
          </article>
        );
      })}
      {!trips.length ? (
        <p className="rounded-lg border bg-white p-4 text-sm text-slate-500">No trips found.</p>
      ) : null}
    </div>
  );
}
