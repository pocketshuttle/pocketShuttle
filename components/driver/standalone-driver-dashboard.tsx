"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { BadgeCheck, Calendar, Car, Check, CheckCircle2, ChevronRight, CircleSlash, Clock3, Copy, Crosshair, LifeBuoy, Loader2, LockKeyhole, MapPin, Navigation, Phone, PlusCircle, Radio, Send, Settings, ShieldCheck, Ticket, UserRound, UsersRound, X } from "lucide-react";

import { KnownDriverNotificationBell } from "@/components/known-driver-network/notification-bell";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { pusherClient } from "@/pusher/client";

type Assignment = {
  id: string;
  status: string;
  billingStatus: string;
  lastStatus?: string | null;
  lastStatusAt?: string | Date | null;
  trialEndsAt?: string | Date | null;
  child: {
    id: string;
    fullName: string;
    age?: number | null;
    grade?: string | null;
    address?: string | null;
    schoolCoords?: { latitude: number; longitude: number } | null;
    image?: string | null;
  };
  events?: Array<{ id: string; eventType: string; createdAt: string | Date }>;
};

type CustomPlace = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
};

type TripTemplate = {
  id: string;
  title: string;
  schedule: { frequency?: string } | null;
  nextRunAt?: string | Date | null;
};

type Connection = {
  id: string;
  status: string;
  requestedBy?: string | null;
  parent: {
    id: string;
    full_name?: string | null;
    phoneNumber?: string | null;
    image?: string | null;
  };
  assignments: Assignment[];
  customPlaces?: CustomPlace[];
  tripTemplates?: TripTemplate[];
};

type Driver = {
  id: string;
  full_name: string;
  image?: string | null;
  phoneNumber?: string | null;
  address: string;
  liveAddress?: { latitude: number; longitude: number } | null;
  landmark?: string | null;
  utilityBillUrl?: string | null;
  identityDocumentUrl?: string | null;
  verificationStatus: string;
  verificationRejectionReason?: string | null;
  serviceAreas: string[];
  carMake?: string | null;
  carModel?: string | null;
  carColor?: string | null;
  plateNumber?: string | null;
  vehicleCapacity?: number | null;
  shareProfile?: { shareId: string } | null;
};

type SupportTicket = {
  id: string;
  message: string;
  status: "PENDING" | "FIXED";
  createdAt: string | Date;
  updatedAt: string | Date;
  fixedAt?: string | Date | null;
  deletedAt?: string | Date | null;
};

type Props = {
  driver: Driver;
  connectionsData: Connection[];
};

async function jsonFetch(url: string, init?: RequestInit) {
  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.message || "Request failed");
  return data;
}

function formatDateTime(value?: string | Date | null) {
  if (!value) return null;
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function statusTone(status?: string | null) {
  if (status === "PARENT_APPROVED" || status === "ACTIVE" || status === "PICKED_UP" || status === "DROPPED_OFF") {
    return "bg-emerald-50 text-emerald-700";
  }
  if (status === "REVOKED" || status === "DECLINED") {
    return "bg-rose-50 text-rose-700";
  }
  return "bg-amber-50 text-amber-700";
}

function StatusBadge({ status }: { status?: string | null }) {
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusTone(status)}`}>
      {(status || "UNKNOWN").replaceAll("_", " ")}
    </span>
  );
}

const tripStages = [
  { action: "on_the_way", eventType: "ON_THE_WAY_TO_SCHOOL", label: "OTW" },
  { action: "picked_up", eventType: "PICKED_UP", label: "Picked up" },
  { action: "dropped_off", eventType: "DROPPED_OFF", label: "Dropped off" },
] as const;

function childPlaceLabel(assignment: Assignment) {
  const statusEvents = (assignment.events || [])
    .filter((event) => ["ON_THE_WAY_TO_SCHOOL", "PICKED_UP", "DROPPED_OFF"].includes(event.eventType))
    .slice()
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  const pickupCount = statusEvents.filter((event) => event.eventType === "PICKED_UP").length;

  if (assignment.lastStatus === "DROPPED_OFF") {
    return pickupCount > 0 && pickupCount % 2 === 0 ? "At home" : "In school";
  }

  if (assignment.lastStatus === "PICKED_UP") {
    return pickupCount > 0 && pickupCount % 2 === 0 ? "On the way home" : "On the way to school";
  }

  if (assignment.lastStatus === "ON_THE_WAY_TO_SCHOOL") {
    return "Driver on the way";
  }

  return "Waiting";
}

function getCurrentGpsPosition() {
  return new Promise<GeolocationPosition>((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("GPS is not available in this browser."));
      return;
    }

    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 20000,
      maximumAge: 0,
    });
  });
}

export function StandaloneDriverDashboard({ driver, connectionsData }: Props) {
  const [connections, setConnections] = useState(connectionsData);
  const [reviewTarget, setReviewTarget] = useState<Connection | null>(null);
  const [reviewStep, setReviewStep] = useState<"details" | "confirm">("details");
  const [verification, setVerification] = useState({
    image: driver.image || "",
    liveAddress: driver.liveAddress || null,
  });
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [liveSharingOn, setLiveSharingOn] = useState(false);
  const [lastSharedAt, setLastSharedAt] = useState<string | null>(null);
  const [supportMessage, setSupportMessage] = useState("");
  const [supportSubmitting, setSupportSubmitting] = useState(false);
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);
  const [supportMode, setSupportMode] = useState<"track" | "new" | "history">("new");
  const [supportLoaded, setSupportLoaded] = useState(false);
  const [supportLoading, setSupportLoading] = useState(false);
  const watchIdRef = useRef<number | null>(null);
  const lastContinuousShareRef = useRef(0);
  const continuousShareInFlightRef = useRef(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get("openMenu")) {
      setSettingsOpen(true);
      router.replace("/driver");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const verified = driver.verificationStatus === "VERIFIED";
  const shareId = driver.shareProfile?.shareId || "Generating";
  const vehicleName = [driver.carColor, driver.carMake, driver.carModel].filter(Boolean).join(" ");
  const approvedConnections = connections.filter((connection) => connection.status === "PARENT_APPROVED");
  const pendingConnections = connections.filter(
    (connection) => connection.status === "INVITED" || connection.status === "DRIVER_REQUESTED"
  );
  const assignments = approvedConnections.flatMap((connection) =>
    connection.assignments.map((assignment) => ({ ...assignment, parent: connection.parent }))
  );

  const copyShareId = async () => {
    await navigator.clipboard.writeText(shareId);
    toast({ description: "Driver share ID copied." });
  };

  const copyDriverId = async () => {
    await navigator.clipboard.writeText(driver.id);
    toast({ description: "Driver ID copied." });
  };

  const loadSupportTickets = async (mode: "track" | "history" = "track") => {
    setSupportLoading(true);
    try {
      const data = await jsonFetch(mode === "history" ? "/api/support-tickets?view=history" : "/api/support-tickets");
      const tickets = Array.isArray(data.tickets) ? data.tickets : [];
      setSupportTickets(tickets);
      setSupportMode(mode === "history" ? "history" : tickets.length ? "track" : "new");
      setSupportLoaded(true);
    } catch (error) {
      toast({
        description: error instanceof Error ? error.message : "Unable to load support tickets.",
        variant: "destructive",
      });
    } finally {
      setSupportLoading(false);
    }
  };

  const submitSupportTicket = async () => {
    const message = supportMessage.trim();
    if (message.length < 5) {
      toast({ description: "Please describe the issue before sending.", variant: "destructive" });
      return;
    }

    setSupportSubmitting(true);
    try {
      const data = await jsonFetch("/api/support-tickets", {
        method: "POST",
        body: JSON.stringify({ message }),
      });
      setSupportMessage("");
      setSupportTickets((current) => [data.ticket, ...current].filter(Boolean));
      setSupportMode("track");
      setSupportLoaded(true);
      toast({ description: data.message || "Support request sent." });
    } catch (error) {
      toast({
        description: error instanceof Error ? error.message : "Unable to send support request.",
        variant: "destructive",
      });
    } finally {
      setSupportSubmitting(false);
    }
  };

  const postLocation = async ({
    latitude,
    longitude,
    accuracy,
    continuous = false,
  }: {
    latitude: number;
    longitude: number;
    accuracy?: number | null;
    continuous?: boolean;
  }) => {
    await jsonFetch("/api/drivers/location", {
      method: "POST",
      body: JSON.stringify({
        latitude,
        longitude,
        accuracy,
        continuous,
      }),
    });
    setVerification((current) => ({
      ...current,
      liveAddress: { latitude, longitude },
    }));
    setLastSharedAt(new Date().toISOString());
  };

  const captureLocation = (continuous = false) => {
    if (!navigator.geolocation) {
      toast({ description: "GPS is not available in this browser.", variant: "destructive" });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const liveAddress = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        startTransition(async () => {
          try {
            await postLocation({
              latitude: liveAddress.latitude,
              longitude: liveAddress.longitude,
              accuracy: position.coords.accuracy,
              continuous,
            });
            if (!continuous) toast({ description: "Live GPS location shared." });
          } catch (error) {
            toast({ description: error instanceof Error ? error.message : "Unable to share location", variant: "destructive" });
          }
        });
      },
      () => {
        toast({ description: "Unable to capture GPS location.", variant: "destructive" });
      },
      { enableHighAccuracy: true }
    );
  };

  useEffect(() => {
    const handleShareLocationRequest = () => captureLocation(false);
    window.addEventListener("standalone-driver:share-location", handleShareLocationRequest);
    return () => window.removeEventListener("standalone-driver:share-location", handleShareLocationRequest);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stopLiveSharing = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setLiveSharingOn(false);
  };

  const toggleLiveSharing = () => {
    if (liveSharingOn) {
      stopLiveSharing();
      toast({ description: "Continuous live location is off." });
      return;
    }

    if (!navigator.geolocation) {
      toast({ description: "GPS is not available in this browser.", variant: "destructive" });
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const now = Date.now();
        if (continuousShareInFlightRef.current || now - lastContinuousShareRef.current < 15000) {
          return;
        }

        continuousShareInFlightRef.current = true;
        postLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          continuous: true,
        })
          .then(() => {
            lastContinuousShareRef.current = Date.now();
          })
          .catch((error) => {
            toast({ description: error instanceof Error ? error.message : "Unable to share location", variant: "destructive" });
          })
          .finally(() => {
            continuousShareInFlightRef.current = false;
          });
      },
      () => {
        stopLiveSharing();
        toast({ description: "Unable to keep live location on.", variant: "destructive" });
      },
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 20000 }
    );

    watchIdRef.current = watchId;
    setLiveSharingOn(true);
    toast({ description: "Continuous live location is on." });
  };

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (settingsOpen && !supportLoaded && !supportLoading) {
      loadSupportTickets();
    }
  }, [settingsOpen, supportLoaded, supportLoading]);

  const refreshConnections = async () => {
    const data = await jsonFetch("/api/parent-driver-connections");
    const nextConnections: Connection[] = data.connections || [];
    setConnections((current) => {
      const previousPendingIds = new Set(
        current.filter((connection) => connection.status !== "PARENT_APPROVED").map((connection) => connection.id)
      );
      const newRequest = nextConnections.find(
        (connection) =>
          connection.status === "INVITED" &&
          connection.requestedBy === "parent" &&
          !previousPendingIds.has(connection.id)
      );
      if (newRequest) {
        toast({ description: `${newRequest.parent.full_name || "A parent"} wants to connect with you.` });
      }
      return nextConnections;
    });
  };

  useEffect(() => {
    if (!driver.id) return;

    const channelName = `private-known-driver-driver-${driver.id}`;
    const channel = process.env.NEXT_PUBLIC_PUSHER_KEY ? pusherClient.subscribe(channelName) : null;
    const refresh = () => {
      refreshConnections().catch((error) => {
        console.error("Unable to refresh known-driver connections", error);
      });
    };

    channel?.bind("connection-updated", refresh);
    channel?.bind("child-driver-event", refresh);

    const pollId = window.setInterval(refresh, 15000);

    return () => {
      window.clearInterval(pollId);
      channel?.unbind("connection-updated", refresh);
      channel?.unbind("child-driver-event", refresh);
      if (channel) pusherClient.unsubscribe(channelName);
    };
  }, [driver.id]);

  const markChildStatus = (assignmentId: string, action: "on_the_way" | "picked_up" | "dropped_off") => {
    startTransition(async () => {
      try {
        const gpsPosition = action === "dropped_off" ? await getCurrentGpsPosition() : null;
        const data = await jsonFetch(`/api/child-driver-assignments/${assignmentId}/status`, {
          method: "PATCH",
          body: JSON.stringify({
            action,
            latitude: gpsPosition?.coords.latitude,
            longitude: gpsPosition?.coords.longitude,
            accuracy: gpsPosition?.coords.accuracy,
          }),
        });
        if (data.assignment) {
          setConnections((current) =>
            current.map((connection) => ({
              ...connection,
              assignments: connection.assignments.map((assignment) =>
                assignment.id === assignmentId ? { ...assignment, ...data.assignment } : assignment
              ),
            }))
          );
        }
        toast({ description: data.message });
      } catch (error) {
        toast({ description: error instanceof Error ? error.message : "Unable to update child", variant: "destructive" });
      }
    });
  };

  const approveConnection = (connectionId: string) => {
    startTransition(async () => {
      try {
        const data = await jsonFetch(`/api/parent-driver-connections/${connectionId}/approve`, { method: "PATCH" });
        setConnections((current) =>
          current.map((connection) =>
            connection.id === connectionId ? { ...connection, ...data.connection } : connection
          )
        );
        toast({ description: data.message });
        setReviewTarget(null);
        setReviewStep("details");
      } catch (error) {
        toast({ description: error instanceof Error ? error.message : "Unable to accept parent request", variant: "destructive" });
      }
    });
  };

  const declineConnection = (connectionId: string) => {
    startTransition(async () => {
      try {
        const data = await jsonFetch(`/api/parent-driver-connections/${connectionId}/decline`, { method: "PATCH" });
        setConnections((current) =>
          current.map((connection) =>
            connection.id === connectionId ? { ...connection, ...data.connection } : connection
          )
        );
        toast({ description: data.message });
        setReviewTarget(null);
        setReviewStep("details");
      } catch (error) {
        toast({ description: error instanceof Error ? error.message : "Unable to decline parent request", variant: "destructive" });
      }
    });
  };

  const openRequestReview = (connection: Connection) => {
    setReviewTarget(connection);
    setReviewStep("details");
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      {settingsOpen && (
        <button
          type="button"
          aria-label="Close settings"
          className="fixed inset-0 z-40 bg-slate-950/40"
          onClick={() => setSettingsOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[min(92vw,420px)] flex-col overflow-y-auto border-r border-slate-200 bg-white shadow-2xl transition-transform duration-300 ${settingsOpen ? "translate-x-0" : "-translate-x-full"
          }`}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white p-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-full bg-slate-100">
              {verification.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={verification.image} alt="" className="h-full w-full object-cover" />
              ) : (
                <UserRound className="h-6 w-6 text-slate-500" aria-hidden="true" />
              )}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{driver.full_name}</p>
              <Link
                href="/driver/verify"
                className={`text-xs font-medium ${verified ? "text-emerald-700 hover:text-emerald-800" : "text-blue-700 hover:text-blue-900"}`}
              >
                {verified ? "Verify" : "Verify your account"}
              </Link>
            </div>
          </div>
          <button type="button" onClick={() => setSettingsOpen(false)} className="rounded-md p-2 text-slate-500 hover:bg-slate-100" aria-label="Close settings">
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="grid gap-5 p-4">
          <section className="rounded-lg border border-slate-200 bg-white p-4">
            <h2 className="mb-4 text-base font-semibold">Driver share ID</h2>
            <div className="rounded-lg bg-slate-950 p-4 text-white">
              <p className="text-xs text-white/50">Parents use this ID to add you</p>
              <div className="mt-2 flex items-center justify-between gap-3">
                <p className="text-2xl font-semibold">{shareId}</p>
                <Button size="sm" variant="secondary" onClick={copyShareId} className="gap-2">
                  <Copy className="h-4 w-4" /> Copy
                </Button>
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-4">
            <h2 className="mb-4 text-base font-semibold">Vehicle details</h2>
            <div className="rounded-lg bg-slate-950 p-4 text-white">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-lg font-semibold">{vehicleName || "Vehicle not completed"}</p>
                  <p className="text-sm text-white/60">{driver.plateNumber || "No plate number"}</p>
                </div>
                <Car className="h-6 w-6 shrink-0 text-white/80" aria-hidden="true" />
              </div>
            </div>
            <div className="mt-3 flex gap-3 rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
              <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <p>Vehicle details are reviewed for trust and safety. Contact support to change approved vehicle records.</p>
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="mb-4 flex items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-blue-50 text-blue-700">
                <LifeBuoy className="h-4 w-4" aria-hidden="true" />
              </span>
              <h2 className="text-base font-semibold">Contact support</h2>
            </div>
            <div className="grid gap-3">

              {supportLoaded && (
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    type="button"
                    variant={supportMode === "track" ? "default" : "outline"}
                    onClick={() => loadSupportTickets("track")}
                    className="gap-2"
                  >
                    <Ticket className="h-4 w-4" aria-hidden="true" />
                    Track ticket
                  </Button>
                  <Button
                    type="button"
                    variant={supportMode === "history" ? "default" : "outline"}
                    onClick={() => loadSupportTickets("history")}
                    className="gap-2"
                  >
                    <Clock3 className="h-4 w-4" aria-hidden="true" />
                    History
                  </Button>
                  <Button
                    type="button"
                    variant={supportMode === "new" ? "default" : "outline"}
                    onClick={() => setSupportMode("new")}
                    className="gap-2"
                  >
                    <PlusCircle className="h-4 w-4" aria-hidden="true" />
                    New ticket
                  </Button>
                </div>
              )}

              {supportLoading && (
                <div className="flex items-center justify-center gap-2 rounded-md bg-slate-50 p-3 text-sm text-slate-500">
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Loading tickets...
                </div>
              )}

              {(supportMode === "track" || supportMode === "history") && supportTickets.length > 0 ? (
                <div className="grid gap-2">
                  {supportTickets.map((ticket) => (
                    <div key={ticket.id} className="rounded-md border border-slate-200 p-3">
                      <div className="flex items-center justify-between gap-3">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${ticket.status === "FIXED" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                          {ticket.status === "FIXED" ? <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" /> : <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />}
                          {ticket.status}
                        </span>
                        <span className="shrink-0 text-xs text-slate-500">{formatDateTime(ticket.createdAt)}</span>
                      </div>
                      <p className="mt-2 line-clamp-3 whitespace-pre-wrap text-sm text-slate-700">{ticket.message}</p>
                      {supportMode === "history" && ticket.deletedAt && (
                        <p className="mt-2 text-xs font-medium text-slate-500">
                          History until {formatDateTime(new Date(new Date(ticket.deletedAt).getTime() + 21 * 24 * 60 * 60 * 1000))}
                        </p>
                      )}
                    </div>
                  ))}
                  <Button type="button" variant="outline" onClick={() => setSupportMode("new")} className="gap-2">
                    <PlusCircle className="h-4 w-4" aria-hidden="true" />
                    Open new ticket
                  </Button>
                </div>
              ) : supportMode === "history" ? (
                <div className="grid gap-3">
                  <p className="rounded-md bg-slate-50 p-3 text-sm text-slate-500">No deleted ticket history from the last 21 days.</p>
                  <Button type="button" variant="outline" onClick={() => setSupportMode("new")} className="gap-2">
                    <PlusCircle className="h-4 w-4" aria-hidden="true" />
                    Open new ticket
                  </Button>
                </div>
              ) : (
                <div className="grid gap-3">
                  <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                    <p className="text-xs font-medium text-slate-500">From</p>
                    <p className="mt-1 truncate text-sm font-semibold text-slate-950">{driver.full_name}</p>
                    <div className="mt-2 flex items-center justify-between gap-2 rounded-md bg-white px-3 py-2">
                      <span className="min-w-0 truncate text-xs font-medium text-slate-600">{driver.id}</span>
                      <button
                        type="button"
                        onClick={copyDriverId}
                        className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-950"
                        aria-label="Copy driver ID"
                        title="Copy driver ID"
                      >
                        <Copy className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                  <Textarea
                    value={supportMessage}
                    onChange={(event) => setSupportMessage(event.target.value)}
                    placeholder="Tell support what happened"
                    maxLength={2000}
                    className="min-h-28 resize-none border-slate-200 bg-white text-slate-900 shadow-none"
                  />
                  <Button
                    type="button"
                    disabled={supportSubmitting || supportMessage.trim().length < 5}
                    onClick={submitSupportTicket}
                    className="gap-2"
                  >
                    {supportSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    ) : (
                      <Send className="h-4 w-4" aria-hidden="true" />
                    )}
                    {supportSubmitting ? "Sending..." : "Send"}
                  </Button>
                </div>
              )}
            </div>
          </section>

          <section className="overflow-hidden rounded-lg border border-slate-200 bg-white p-1">
            <Link href="/driver/settings" className="flex items-center gap-3 rounded-md p-3 hover:bg-slate-50">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-700">
                <Settings className="h-4 w-4" aria-hidden="true" />
              </span>
              <span className="flex-1 text-sm font-semibold text-slate-950">Settings</span>
              <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
            </Link>
          </section>
        </div>
      </aside>

      <nav className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl items-center gap-4">
          <button type="button" onClick={() => setSettingsOpen(true)} className="flex min-w-0 flex-1 items-center gap-4 text-left" aria-label="Open driver details">
            <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full bg-slate-100 ring-1 ring-slate-200">
              {verification.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={verification.image} alt="" className="h-full w-full object-cover" />
              ) : (
                <UserRound className="h-5 w-5 text-slate-500" aria-hidden="true" />
              )}
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex min-w-0 items-center gap-2">
                <span className="truncate text-base font-semibold capitalize text-slate-950">{driver.full_name}</span>
                {verified ? <BadgeCheck className="h-6 w-6 shrink-0 text-emerald-600" aria-label="Verified" /> : <CircleSlash className="h-6 w-6 shrink-0 text-slate-400" aria-label="Not verified" />}
              </span>
              <span className="block truncate text-xs font-semibold uppercase tracking-wide text-slate-500">{shareId}</span>
            </span>
          </button>
          <div className="ml-auto flex shrink-0 items-center gap-2">
            <KnownDriverNotificationBell role="driver" id={driver.id} />
            <button
              type="button"
              disabled={isPending}
              onClick={toggleLiveSharing}
              role="switch"
              aria-checked={liveSharingOn}
              aria-label={liveSharingOn ? "Turn live location off" : "Turn live location on"}
              title={liveSharingOn ? "Turn live location off" : "Turn live location on"}
              className="flex h-10 w-14 shrink-0 items-center justify-center rounded-full hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-70"
            >
              <span className={`flex h-7 w-12 items-center rounded-full p-0.5 transition-colors ${liveSharingOn ? "bg-emerald-500" : "bg-slate-200"}`}>
                <span className={`h-6 w-6 rounded-full bg-white shadow transition-transform ${liveSharingOn ? "translate-x-5" : "translate-x-0"}`} />
              </span>
            </button>
          </div>
        </div>
      </nav>

      <div className="mx-auto grid w-full max-w-7xl gap-5 px-4 py-6">

        {!verified && (
          <Link
            href="/driver/verify"
            className="flex items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900 hover:bg-amber-100"
          >
            <span className="flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 shrink-0 text-amber-700" aria-hidden="true" />
              <span className="text-sm font-medium">Verify your account so parents can trust and connect with you</span>
            </span>
            <ChevronRight className="h-5 w-5 shrink-0 text-amber-700" aria-hidden="true" />
          </Link>
        )}
        <section className="grid grid-cols-3 gap-2 sm:gap-4">
          <div className="grid justify-items-center rounded-lg border border-slate-200 bg-white px-2 py-3 text-center sm:p-4">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-emerald-50 text-emerald-700 sm:h-10 sm:w-10">
              <UsersRound className="h-5 w-5" aria-hidden="true" />
            </span>
            <p className="mt-2 text-xs leading-tight text-slate-500 sm:text-sm">families </p>
            <p className="mt-1 text-2xl font-semibold sm:mt-2 sm:text-3xl">{approvedConnections.length}</p>
          </div>
          <div className="grid justify-items-center rounded-lg border border-slate-200 bg-white px-2 py-3 text-center sm:p-4">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-sky-50 text-sky-700 sm:h-10 sm:w-10">
              <UserRound className="h-5 w-5" aria-hidden="true" />
            </span>
            <p className="mt-2 text-xs leading-tight text-slate-500 sm:text-sm"> kids</p>
            <p className="mt-1 text-2xl font-semibold sm:mt-2 sm:text-3xl">{assignments.length}</p>
          </div>
          <div className="grid justify-items-center rounded-lg border border-slate-200 bg-white px-2 py-3 text-center sm:p-4">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-amber-50 text-amber-700 sm:h-10 sm:w-10">
              <CircleSlash className="h-5 w-5" aria-hidden="true" />
            </span>
            <p className="mt-2 text-xs leading-tight text-slate-500 sm:text-sm">Pending </p>
            <p className="mt-1 text-2xl font-semibold sm:mt-2 sm:text-3xl">{pendingConnections.length}</p>
          </div>
        </section>
        <section className="rounded-lg border border-slate-200 bg-white p-3">
          <div className="grid gap-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-3">
                <span className={`relative grid h-10 w-10 shrink-0 place-items-center rounded-full ${liveSharingOn ? "bg-emerald-50 text-emerald-700" : "bg-blue-50 text-blue-700"}`}>
                  <MapPin className="h-5 w-5" aria-hidden="true" />
                  {liveSharingOn && (
                    <span className="absolute -bottom-0.5 -right-0.5 grid h-5 w-5 place-items-center rounded-full bg-emerald-500 text-white ring-2 ring-white">
                      <Check className="h-3 w-3" aria-hidden="true" />
                    </span>
                  )}
                </span>
                <div className="min-w-0">
                  <h2 className="font-semibold">Share live location</h2>
                  <p className="mt-1 max-w-xl text-xs leading-4 text-slate-500">Parents with approved, assigned kids can see your latest active location.</p>
                </div>
              </div>
              {/* <span className={`inline-flex w-fit items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold ${liveSharingOn ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                <span className={`h-2 w-2 rounded-full ${liveSharingOn ? "bg-emerald-500" : "bg-slate-400"}`} />
                {liveSharingOn ? "Active" : "Inactive"}
              </span> */}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className={`rounded-lg border bg-white px-3 py-5 text-center sm:p-3 sm:text-left ${liveSharingOn ? "border-emerald-200" : "border-slate-200"}`}>
                <div className="grid justify-items-center gap-3 sm:flex sm:items-start sm:justify-items-start sm:gap-2.5">
                  <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-full sm:h-8 sm:w-8 ${liveSharingOn ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                    <Radio className="h-6 w-6 sm:h-4 sm:w-4" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-base font-semibold text-slate-700 sm:text-sm sm:text-slate-950">{liveSharingOn ? "Sharing on" : "Sharing off"}</p>
                    <p className="mt-0.5 hidden text-xs text-slate-500 sm:block">
                      {liveSharingOn ? "Your location is being shared automatically." : "Your location is not being shared continuously."}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 bg-white px-3 py-5 text-center sm:p-3 sm:text-left">
                <div className="grid min-w-0 justify-items-center gap-3 sm:flex sm:items-start sm:justify-items-start sm:gap-2.5">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-blue-50 text-blue-700 sm:h-8 sm:w-8">
                    <Crosshair className="h-6 w-6 sm:h-4 sm:w-4" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-base font-semibold text-slate-700 sm:text-xs sm:font-medium sm:text-slate-500">Latest location</p>
                    <p className="mt-0.5 hidden break-words text-sm font-semibold text-slate-950 sm:block">
                      {verification.liveAddress
                        ? `${verification.liveAddress.latitude}, ${verification.liveAddress.longitude}`
                        : "No live GPS shared yet."}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 bg-white px-3 py-5 text-center sm:p-3 sm:text-left">
                <div className="grid justify-items-center gap-3 sm:flex sm:items-start sm:justify-items-start sm:gap-2.5">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-500 sm:h-8 sm:w-8">
                    <Calendar className="h-6 w-6 sm:h-4 sm:w-4" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-base font-semibold text-slate-700 sm:text-xs sm:font-medium sm:text-slate-500">Last shared</p>
                    <p className="mt-0.5 hidden text-sm font-semibold text-slate-950 sm:block">{lastSharedAt ? formatDateTime(lastSharedAt) : "Not shared yet"}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-5 text-center sm:p-3 sm:text-left">
                <div className="grid justify-items-center gap-3 sm:flex sm:items-start sm:justify-between">
                  <div className="grid min-w-0 justify-items-center gap-3 sm:flex sm:items-start sm:justify-items-start sm:gap-2.5">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-blue-50 text-blue-700 sm:h-8 sm:w-8">
                      <ShieldCheck className="h-6 w-6 sm:h-4 sm:w-4" aria-hidden="true" />
                    </span>
                    <p className="text-base font-semibold text-slate-700 sm:text-xs sm:font-normal sm:leading-5 sm:text-slate-600">Privacy</p>
                    <p className="hidden text-xs leading-5 text-slate-600 sm:block">Your location is only shared with approved parents of your assigned kids.</p>
                  </div>
                  <LockKeyhole className="hidden h-4 w-4 shrink-0 text-blue-700 sm:block" aria-hidden="true" />
                </div>
              </div>
            </div>

            <button
              type="button"
              disabled={isPending}
              onClick={() => captureLocation(false)}
              className="flex items-center justify-between gap-3 rounded-md bg-blue-700 p-3 text-left text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-70"
            >
              <span className="flex min-w-0 items-center gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/15">
                  <Navigation className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold">Share location now</span>
                  <span className="block text-xs text-white/75">Send your current location to parents</span>
                </span>
              </span>
              <ChevronRight className="h-5 w-5 shrink-0" aria-hidden="true" />
            </button>
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="mb-4 text-base font-semibold">Pending families</h2>
          <div className="grid gap-3">
            {pendingConnections.map((connection) => (
              <div key={connection.id} className="flex flex-col gap-3 rounded-md border border-slate-200 p-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-full bg-slate-100">
                    {connection.parent.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={connection.parent.image} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <UserRound className="h-6 w-6 text-slate-500" aria-hidden="true" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{connection.parent.full_name || "Parent"}</p>
                    <p className="flex items-center gap-1 text-xs text-slate-500"><Phone className="h-3.5 w-3.5" /> {connection.parent.phoneNumber || "No phone"}</p>
                    {connection.status === "INVITED" && connection.requestedBy === "parent" && (
                      <p className="mt-1 text-xs font-medium text-amber-700">Parent is requesting to connect</p>
                    )}
                    {connection.status === "DRIVER_REQUESTED" && (
                      <p className="mt-1 text-xs font-medium text-amber-700">Waiting for parent approval</p>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={connection.status} />
                  {connection.status === "INVITED" && connection.requestedBy === "parent" && (
                    <>
                      <Button size="sm" variant="outline" disabled={isPending} onClick={() => declineConnection(connection.id)} className="gap-2 border-rose-200 text-rose-700 hover:bg-rose-50">
                        <X className="h-4 w-4" /> Decline
                      </Button>
                      <Button size="sm" disabled={isPending} onClick={() => openRequestReview(connection)} className="gap-2">
                        <Check className="h-4 w-4" /> Review request
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
            {!pendingConnections.length && (
              <div className="flex items-center gap-3 rounded-md bg-slate-50 p-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/images/family-icon.svg" alt="" className="h-12 w-12 shrink-0" />
                <p className="text-sm text-slate-500">No pending parent relationships.</p>
              </div>
            )}
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="mb-4 text-base font-semibold">Assigned kids</h2>
          <div className="grid gap-3">

            {assignments.map((assignment) => (
              <div key={assignment.id} className="rounded-md border border-slate-200 p-3">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex min-w-0 gap-3">
                    <div className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-lg bg-slate-100">
                      {assignment.child.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={assignment.child.image} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <UserRound className="h-7 w-7 text-slate-500" aria-hidden="true" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{assignment.child.fullName}</p>
                      <p className="text-xs text-slate-500">Parent: {assignment.parent.full_name || "Parent"}</p>
                      <p className="flex min-w-0 items-center gap-1 text-xs text-slate-500">
                        <MapPin className="h-3.5 w-3.5 shrink-0" />
                        <span className="min-w-0 truncate">{assignment.child.address || "No school address"}</span>
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Last status: {(assignment.lastStatus || "Waiting").replaceAll("_", " ")}
                        {assignment.lastStatusAt ? ` · ${formatDateTime(assignment.lastStatusAt)}` : ""}
                      </p>
                      <p className="mt-1 text-xs font-semibold text-slate-700">{childPlaceLabel(assignment)}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {tripStages.map((stage) => {
                      const active = assignment.lastStatus === stage.eventType;
                      return (
                        <Button
                          key={stage.action}
                          size="sm"
                          variant={active ? "default" : "outline"}
                          disabled={isPending}
                          onClick={() => markChildStatus(assignment.id, stage.action)}
                          className={active ? "gap-2 ring-2 ring-emerald-200" : "gap-2"}
                        >
                          {stage.eventType === "DROPPED_OFF" && <Check className="h-4 w-4" />}
                          {stage.label}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}

            {!assignments.length && <p className="rounded-md bg-slate-50 p-3 text-sm text-slate-500">No children assigned yet. Child details appear only after parent approval.</p>}
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="mb-4 text-base font-semibold">Saved places &amp; recurring trips</h2>
          <div className="grid gap-3">
            {approvedConnections.map((connection) => {
              const customPlaces = connection.customPlaces ?? [];
              const tripTemplates = connection.tripTemplates ?? [];
              const hasData = customPlaces.length > 0 || tripTemplates.length > 0;
              if (!hasData) return null;
              return (
                <div key={connection.id} className="rounded-md border border-slate-200 p-3">
                  <p className="text-sm font-semibold">{connection.parent.full_name || "Parent"}</p>
                  {customPlaces.length > 0 && (
                    <div className="mt-2 grid gap-1.5">
                      {customPlaces.map((place) => (
                        <div key={place.id} className="flex items-center justify-between gap-2 text-xs text-slate-500">
                          <span className="flex min-w-0 items-center gap-1.5">
                            <MapPin className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate">{place.name}</span>
                          </span>
                          <a
                            href={`https://www.google.com/maps?q=${place.latitude},${place.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="shrink-0 font-medium text-blue-600 hover:underline"
                          >
                            View on map
                          </a>
                        </div>
                      ))}
                    </div>
                  )}
                  {tripTemplates.length > 0 && (
                    <div className="mt-2 grid gap-1.5">
                      {tripTemplates.map((template) => (
                        <p key={template.id} className="flex items-center gap-1.5 text-xs text-slate-500">
                          <Calendar className="h-3.5 w-3.5 shrink-0" />
                          {template.title} · {template.schedule?.frequency || "Scheduled"}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
            {!approvedConnections.some(
              (connection) => (connection.customPlaces ?? []).length > 0 || (connection.tripTemplates ?? []).length > 0
            ) && (
              <p className="rounded-md bg-slate-50 p-3 text-sm text-slate-500">
                No saved places or recurring trips from your connected parents yet.
              </p>
            )}
          </div>
        </section>

      </div>

      {reviewTarget && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/40 p-0 sm:items-center sm:p-4">
          <div className="w-full max-w-md rounded-t-xl bg-white p-4 shadow-2xl sm:rounded-xl">
            {reviewStep === "details" ? (
              <>
                <div className="-mx-4 -mt-4 mb-4 overflow-hidden rounded-t-xl bg-[#e0f2fe] sm:mx-0 sm:mt-0 sm:rounded-lg">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/images/new-request-icon.svg" alt="" className="h-32 w-full object-contain" />
                </div>
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium uppercase text-slate-500">New request</p>
                    <h2 className="mt-1 text-lg font-semibold">Parent details</h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setReviewTarget(null);
                      setReviewStep("details");
                    }}
                    className="rounded-md p-2 hover:bg-slate-100"
                    aria-label="Close request review"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="flex items-center gap-3 rounded-md border border-slate-200 p-3">
                  <div className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-full bg-slate-100">
                    {reviewTarget.parent.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={reviewTarget.parent.image} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <UserRound className="h-7 w-7 text-slate-500" aria-hidden="true" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{reviewTarget.parent.full_name || "Parent"}</p>
                    <p className="text-xs text-slate-500">Wants to connect with you</p>
                  </div>
                  {reviewTarget.parent.phoneNumber && (
                    <Button size="sm" variant="outline" asChild className="shrink-0 gap-2">
                      <a href={`tel:${reviewTarget.parent.phoneNumber}`}>
                        <Phone className="h-4 w-4" />
                      </a>
                    </Button>
                  )}
                </div>

                <div className="mt-3 flex items-start gap-3 rounded-md bg-indigo-50/50 p-3 text-sm text-slate-600">
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-indigo-700" aria-hidden="true" />
                  <p>Once accepted, this parent can assign their children to you and see your live location while sharing is on.</p>
                </div>

                <div className="mt-4 flex md:flex-col gap-2 sm:flex-row sm:justify-between w-full ">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isPending}
                    onClick={() => declineConnection(reviewTarget.id)}
                    className="gap-2 border-rose-200 text-rose-700 hover:bg-rose-50 w-full"
                  >
                    <X className="h-4 w-4" /> Decline
                  </Button>
                  <Button type="button" disabled={isPending} onClick={() => setReviewStep("confirm")} className="gap-2">
                    <Check className="h-4 w-4" /> Continue to accept
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium uppercase text-slate-500">Confirm</p>
                    <h2 className="mt-1 text-lg font-semibold">Accept this request?</h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setReviewTarget(null);
                      setReviewStep("details");
                    }}
                    className="rounded-md p-2 hover:bg-slate-100"
                    aria-label="Close request review"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="divide-y divide-slate-100 rounded-md border border-slate-200">
                  <div className="flex items-center justify-between gap-3 p-3">
                    <span className="text-sm text-slate-500">Parent</span>
                    <span className="text-sm font-medium">{reviewTarget.parent.full_name || "Parent"}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3 p-3">
                    <span className="text-sm text-slate-500">Contact</span>
                    <span className="text-sm font-medium">{reviewTarget.parent.phoneNumber || "No phone"}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3 p-3">
                    <span className="text-sm text-slate-500">Status</span>
                    <span className="text-sm font-medium">Awaiting your response</span>
                  </div>
                </div>

                <div className="mt-3 flex items-start gap-3 rounded-md bg-amber-50 p-3 text-sm text-amber-900">
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" aria-hidden="true" />
                  <p>You can revoke this relationship later from Pending families if anything changes.</p>
                </div>

                <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
                  <Button type="button" variant="outline" disabled={isPending} onClick={() => setReviewStep("details")}>
                    Go back
                  </Button>
                  <Button type="button" disabled={isPending} onClick={() => approveConnection(reviewTarget.id)} className="gap-2">
                    <Check className="h-4 w-4" /> Accept request
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
