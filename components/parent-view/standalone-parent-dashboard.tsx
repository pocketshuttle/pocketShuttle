"use client";

import { ChangeEvent, useEffect, useMemo, useState, useTransition } from "react";
import { APIProvider, AdvancedMarker, Map, Marker, Pin } from "@vis.gl/react-google-maps";
import { BadgeCheck, Car, Check, CreditCard, MapPin, MailPlus, Phone, Search, ShieldCheck, Trash2, UserRound, X } from "lucide-react";

import Logout from "@/components/dashboard/sidebar/logout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import { pusherClient } from "@/pusher/client";

type Child = {
  id: string;
  fullName: string;
  age?: number | null;
  grade?: string | null;
  address?: string | null;
  image?: string | null;
};

type DriverSummary = {
  id: string;
  full_name: string;
  email?: string | null;
  phoneNumber?: string | null;
  image?: string | null;
  verificationStatus?: string | null;
  vehicle?: string | null;
  shareId?: string | null;
  liveAddress?: { latitude: number; longitude: number } | null;
  existingConnection?: { id: string; status: string; note?: string | null } | null;
};

type Assignment = {
  id: string;
  status: string;
  billingStatus: string;
  trialEndsAt?: string | Date | null;
  monthlyAmount?: number | null;
  currency?: string | null;
  lastStatus?: string | null;
  lastStatusAt?: string | Date | null;
  child: Child;
  events?: Array<{ id: string; eventType: string; createdAt: string | Date }>;
  payments?: Array<{ id: string; status: string; authorizationUrl?: string | null }>;
};

type Connection = {
  id: string;
  status: string;
  requestedBy?: string | null;
  note?: string | null;
  driver: DriverSummary & { shareProfile?: { shareId: string } | null };
  assignments: Assignment[];
};

type Invite = {
  id: string;
  email?: string | null;
  phoneNumber?: string | null;
  status: string;
  expiresAt: string | Date;
};

type Props = {
  parentId: string;
  parentName?: string | null;
  childrenData: Child[];
  connectionsData: Connection[];
  invitesData: Invite[];
};

const inputClass =
  "h-10 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-none";

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

function formatDate(value?: string | Date | null) {
  if (!value) return "N/A";
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}

function statusTone(status?: string | null) {
  if (status === "PARENT_APPROVED" || status === "ACTIVE" || status === "COMPLETED") {
    return "bg-emerald-50 text-emerald-700";
  }
  if (status === "REVOKED" || status === "DECLINED" || status === "FAILED" || status === "PAST_DUE") {
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

function DriverLocationMap({
  assignment,
}: {
  assignment: Assignment & { driver: DriverSummary };
}) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const location = assignment.driver.liveAddress;

  if (!location) {
    return (
      <div className="grid h-72 place-items-center rounded-lg bg-slate-100 px-4 text-center text-sm text-slate-500">
        Driver has not shared a live location yet.
      </div>
    );
  }

  if (!apiKey) {
    return (
      <div className="grid h-72 place-items-center rounded-lg bg-slate-100 px-4 text-center text-sm text-slate-500">
        Google Maps is unavailable because the API key is missing.
      </div>
    );
  }

  const center = { lat: location.latitude, lng: location.longitude };
  const mapId = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID?.trim();

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200">
      <div className="h-72">
        <APIProvider apiKey={apiKey}>
          <Map
            defaultCenter={center}
            defaultZoom={14}
            {...(mapId ? { mapId } : {})}
            fullscreenControl={false}
            streetViewControl={false}
            mapTypeControl={false}
          >
            {mapId ? (
              <AdvancedMarker position={center} title={assignment.driver.full_name}>
                <Pin background="#111827" borderColor="#ffffff" glyphColor="#ffffff" />
              </AdvancedMarker>
            ) : (
              <Marker position={center} title={assignment.driver.full_name} />
            )}
          </Map>
        </APIProvider>
      </div>
      <div className="border-t border-slate-200 bg-white p-3 text-sm text-slate-600">
        {assignment.driver.full_name} for {assignment.child.fullName}
        {assignment.lastStatusAt ? ` · last child update ${formatDate(assignment.lastStatusAt)}` : ""}
      </div>
    </div>
  );
}

export function StandaloneParentDashboard({
  parentId,
  parentName,
  childrenData,
  connectionsData,
  invitesData,
}: Props) {
  const [children, setChildren] = useState(childrenData);
  const [connections, setConnections] = useState(connectionsData);
  const [invites, setInvites] = useState(invitesData);
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<DriverSummary[]>([]);
  const [inviteForm, setInviteForm] = useState({ email: "", phoneNumber: "" });
  const [childForm, setChildForm] = useState({ fullName: "", age: "", grade: "", address: "" });
  const [selectedChildrenByConnection, setSelectedChildrenByConnection] = useState<Record<string, string[]>>({});
  const [sideMenuOpen, setSideMenuOpen] = useState(false);
  const [addDriverOpen, setAddDriverOpen] = useState(false);
  const [addKidOpen, setAddKidOpen] = useState(false);
  const [locationAssignment, setLocationAssignment] = useState<(Assignment & { driver: DriverSummary }) | null>(null);
  const [revokeTarget, setRevokeTarget] = useState<Connection | null>(null);
  const [revokeReason, setRevokeReason] = useState("");
  const [requestAgainTarget, setRequestAgainTarget] = useState<DriverSummary | null>(null);
  const [assignmentConfirmTarget, setAssignmentConfirmTarget] = useState<Connection | null>(null);
  const [isPending, startTransition] = useTransition();

  const approvedConnections = connections.filter((connection) => connection.status === "PARENT_APPROVED");
  const pendingConnections = connections.filter((connection) => connection.status !== "PARENT_APPROVED");
  const activeAssignments = connections.flatMap((connection) =>
    connection.assignments
      .filter((assignment) => assignment.status === "ACTIVE")
      .map((assignment) => ({ ...assignment, driver: connection.driver }))
  );

  const billingSummary = useMemo(() => {
    const freeTrial = activeAssignments.filter((assignment) => assignment.billingStatus === "FREE_TRIAL").length;
    const active = activeAssignments.filter((assignment) => assignment.billingStatus === "ACTIVE").length;
    const pastDue = activeAssignments.filter((assignment) => assignment.billingStatus === "PAST_DUE").length;
    const nextTrialEnd = activeAssignments
      .map((assignment) => assignment.trialEndsAt)
      .filter(Boolean)
      .map((value) => new Date(value as string | Date))
      .sort((a, b) => a.getTime() - b.getTime())[0];

    return { freeTrial, active, pastDue, nextTrialEnd };
  }, [activeAssignments]);

  useEffect(() => {
    const openAddDriver = () => setAddDriverOpen(true);
    const openMenu = () => setSideMenuOpen(true);
    const openAddKid = () => setAddKidOpen(true);

    window.addEventListener("standalone-parent:add-driver", openAddDriver);
    window.addEventListener("standalone-parent:open-menu", openMenu);
    window.addEventListener("standalone-parent:add-kid", openAddKid);

    return () => {
      window.removeEventListener("standalone-parent:add-driver", openAddDriver);
      window.removeEventListener("standalone-parent:open-menu", openMenu);
      window.removeEventListener("standalone-parent:add-kid", openAddKid);
    };
  }, []);

  const refreshConnections = async () => {
    const data = await jsonFetch("/api/parent-driver-connections");
    setConnections(data.connections || []);
  };

  useEffect(() => {
    if (!parentId) return;

    const refresh = () => {
      refreshConnections().catch((error) => {
        console.error("Unable to refresh known-driver connections", error);
      });
    };
    const channelName = `private-known-driver-parent-${parentId}`;
    const channel = process.env.NEXT_PUBLIC_PUSHER_KEY ? pusherClient.subscribe(channelName) : null;

    channel?.bind("child-driver-event", refresh);
    channel?.bind("connection-updated", refresh);

    const pollId = window.setInterval(refresh, 15000);

    return () => {
      window.clearInterval(pollId);
      channel?.unbind("child-driver-event", refresh);
      channel?.unbind("connection-updated", refresh);
      if (channel) pusherClient.unsubscribe(channelName);
    };
  }, [parentId]);

  const searchDrivers = () => {
    startTransition(async () => {
      try {
        const data = await jsonFetch(`/api/drivers/search?query=${encodeURIComponent(query)}`);
        setSearchResults(data.drivers || []);
      } catch (error) {
        toast({ description: error instanceof Error ? error.message : "Unable to search drivers", variant: "destructive" });
      }
    });
  };

  const requestDriver = (driverId: string) => {
    startTransition(async () => {
      try {
        const data = await jsonFetch("/api/parent-driver-connections", {
          method: "POST",
          body: JSON.stringify({ driverId }),
        });
        setConnections((current) => {
          const existing = current.some((connection) => connection.id === data.connection.id);
          return existing
            ? current.map((connection) => (connection.id === data.connection.id ? { ...connection, ...data.connection } : connection))
            : [data.connection, ...current];
        });
        await refreshConnections();
        setQuery("");
        setSearchResults([]);
        setAddDriverOpen(false);
        setRequestAgainTarget(null);
        toast({ description: data.message });
      } catch (error) {
        toast({ description: error instanceof Error ? error.message : "Unable to request driver", variant: "destructive" });
      }
    });
  };

  const inviteDriver = () => {
    startTransition(async () => {
      try {
        const data = await jsonFetch("/api/drivers/invites", {
          method: "POST",
          body: JSON.stringify(inviteForm),
        });
        setInvites((current) => [data.invite, ...current]);
        setInviteForm({ email: "", phoneNumber: "" });
        await refreshConnections();
        setAddDriverOpen(false);
        toast({ description: data.message });
      } catch (error) {
        toast({ description: error instanceof Error ? error.message : "Unable to invite driver", variant: "destructive" });
      }
    });
  };

  const addChild = () => {
    startTransition(async () => {
      try {
        const data = await jsonFetch("/api/parent/children", {
          method: "POST",
          body: JSON.stringify({
            ...childForm,
            age: childForm.age ? Number(childForm.age) : undefined,
          }),
        });
        setChildren((current) => [data.child, ...current]);
        setChildForm({ fullName: "", age: "", grade: "", address: "" });
        setAddKidOpen(false);
        toast({ description: data.message });
      } catch (error) {
        toast({ description: error instanceof Error ? error.message : "Unable to add child", variant: "destructive" });
      }
    });
  };

  const approveConnection = (connectionId: string) => {
    startTransition(async () => {
      try {
        const data = await jsonFetch(`/api/parent-driver-connections/${connectionId}/approve`, { method: "PATCH" });
        await refreshConnections();
        toast({ description: data.message });
      } catch (error) {
        toast({ description: error instanceof Error ? error.message : "Unable to approve driver", variant: "destructive" });
      }
    });
  };

  const openRevokeModal = (connection: Connection) => {
    setRevokeTarget(connection);
    setRevokeReason("");
  };

  const closeRevokeModal = () => {
    setRevokeTarget(null);
    setRevokeReason("");
  };

  const revokeConnection = () => {
    if (!revokeTarget) return;
    const reason = revokeReason.trim();

    startTransition(async () => {
      try {
        const data = await jsonFetch(`/api/parent-driver-connections/${revokeTarget.id}/revoke`, {
          method: "PATCH",
          body: JSON.stringify({ reason }),
        });
        await refreshConnections();
        closeRevokeModal();
        toast({ description: data.message });
      } catch (error) {
        toast({ description: error instanceof Error ? error.message : "Unable to revoke driver", variant: "destructive" });
      }
    });
  };

  const toggleChild = (connectionId: string, childId: string) => {
    setSelectedChildrenByConnection((current) => {
      const selected = current[connectionId] || [];
      return {
        ...current,
        [connectionId]: selected.includes(childId)
          ? selected.filter((id) => id !== childId)
          : [...selected, childId],
      };
    });
  };

  const saveChildAssignments = (connectionId: string) => {
    const childIds = selectedChildrenByConnection[connectionId] || [];
    startTransition(async () => {
      try {
        const data = await jsonFetch("/api/child-driver-assignments", {
          method: "POST",
          body: JSON.stringify({ connectionId, childIds }),
        });
        await refreshConnections();
        setSelectedChildrenByConnection((current) => ({ ...current, [connectionId]: [] }));
        toast({ description: data.message });
      } catch (error) {
        toast({ description: error instanceof Error ? error.message : "Unable to assign children", variant: "destructive" });
      }
    });
  };

  const assignChildren = (connection: Connection) => {
    if (connection.note) {
      setAssignmentConfirmTarget(connection);
      return;
    }

    saveChildAssignments(connection.id);
  };

  const initializePayment = (assignmentId: string) => {
    startTransition(async () => {
      try {
        const data = await jsonFetch("/api/billing/paystack/initialize", {
          method: "POST",
          body: JSON.stringify({ assignmentId }),
        });
        if (data.payment?.authorizationUrl) {
          window.location.href = data.payment.authorizationUrl;
          return;
        }
        await refreshConnections();
        toast({ description: data.message });
      } catch (error) {
        toast({ description: error instanceof Error ? error.message : "Unable to start payment", variant: "destructive" });
      }
    });
  };

  const requestLocation = (assignmentId: string) => {
    startTransition(async () => {
      try {
        const data = await jsonFetch(`/api/child-driver-assignments/${assignmentId}/location-request`, {
          method: "POST",
        });
        await refreshConnections();
        toast({ description: data.message });
      } catch (error) {
        toast({ description: error instanceof Error ? error.message : "Unable to request location", variant: "destructive" });
      }
    });
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      {sideMenuOpen && (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-40 bg-slate-950/40"
          onClick={() => setSideMenuOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[min(92vw,420px)] flex-col overflow-y-auto border-r border-slate-200 bg-white shadow-2xl transition-transform duration-300 ${sideMenuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white p-4">
          <div className="min-w-0">
            <p className="text-xs uppercase text-slate-500">Parent dashboard</p>
            <p className="truncate text-base font-semibold">{parentName || "Parent"}</p>
          </div>
          <button
            type="button"
            onClick={() => setSideMenuOpen(false)}
            className="rounded-md p-2 text-slate-500 hover:bg-slate-100"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="grid gap-5 p-4">
          <section className="rounded-lg border border-slate-200 bg-white p-4">
            <h2 className="mb-3 text-base font-semibold">Payment plan</h2>
            <div className="grid grid-cols-3 gap-2 text-center text-sm">
              <div className="rounded-md bg-slate-50 p-3">
                <p className="text-lg font-semibold">{billingSummary.freeTrial}</p>
                <p className="text-xs text-slate-500">Trials</p>
              </div>
              <div className="rounded-md bg-slate-50 p-3">
                <p className="text-lg font-semibold">{billingSummary.active}</p>
                <p className="text-xs text-slate-500">Active</p>
              </div>
              <div className="rounded-md bg-slate-50 p-3">
                <p className="text-lg font-semibold">{billingSummary.pastDue}</p>
                <p className="text-xs text-slate-500">Past due</p>
              </div>
            </div>
            <p className="mt-3 text-xs text-slate-500">
              Next trial ending: {billingSummary.nextTrialEnd ? formatDate(billingSummary.nextTrialEnd) : "N/A"}
            </p>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-4">
            <h2 className="mb-3 text-base font-semibold">Pending drivers</h2>
            <div className="grid gap-3">
              {pendingConnections.map((connection) => (
                <div key={connection.id} className="rounded-md border border-slate-200 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{connection.driver.full_name}</p>
                      <p className="text-xs text-slate-500">{connection.driver.shareProfile?.shareId || connection.driver.shareId || "No share ID"}</p>
                      {connection.status === "INVITED" && connection.requestedBy === "parent" && (
                        <p className="mt-1 text-xs font-medium text-amber-700">Waiting for driver to accept</p>
                      )}
                    </div>
                    <StatusBadge status={connection.status} />
                  </div>
                  <div className="mt-3 flex gap-2">
                    {connection.status === "DRIVER_REQUESTED" && (
                      <Button size="sm" disabled={isPending} onClick={() => approveConnection(connection.id)} className="gap-2">
                        <Check className="h-4 w-4" /> Approve
                      </Button>
                    )}
                    <Button size="sm" variant="outline" disabled={isPending} onClick={() => openRevokeModal(connection)}>
                      Revoke
                    </Button>
                  </div>
                </div>
              ))}
              {!pendingConnections.length && <p className="rounded-md bg-slate-50 p-3 text-sm text-slate-500">No pending drivers.</p>}
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-4">
            <h2 className="mb-3 text-base font-semibold">Invites</h2>
            <div className="grid gap-2">
              {invites.map((invite) => (
                <div key={invite.id} className="flex items-center justify-between gap-3 rounded-md border border-slate-200 p-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{invite.email || invite.phoneNumber || "Driver invite"}</p>
                    <p className="text-xs text-slate-500">Expires {formatDate(invite.expiresAt)}</p>
                  </div>
                  <StatusBadge status={invite.status} />
                </div>
              ))}
              {!invites.length && <p className="rounded-md bg-slate-50 p-3 text-sm text-slate-500">No registration invites yet.</p>}
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-4">
            <h2 className="mb-3 text-base font-semibold">Approved drivers</h2>
            <div className="grid gap-2">
              {approvedConnections.map((connection) => (
                <div key={connection.id} className="rounded-md border border-slate-200 p-3">
                  <p className="truncate text-sm font-semibold">{connection.driver.full_name}</p>
                  <p className="text-xs text-slate-500">{connection.assignments.length} assigned kid{connection.assignments.length === 1 ? "" : "s"}</p>
                </div>
              ))}
              {!approvedConnections.length && <p className="rounded-md bg-slate-50 p-3 text-sm text-slate-500">No approved drivers yet.</p>}
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-4">
            <Logout />
          </section>
        </div>
      </aside>

      {addDriverOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/40 p-0 sm:items-center sm:p-4">
          <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-t-xl bg-white p-4 shadow-2xl sm:rounded-xl">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">Add driver</h2>
              <button type="button" onClick={() => setAddDriverOpen(false)} className="rounded-md p-2 hover:bg-slate-100" aria-label="Close add driver">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
              <section className="rounded-lg border border-slate-200 p-4">
                <h3 className="mb-3 text-base font-semibold">Find known driver</h3>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Input className={inputClass} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Driver share ID, email, or phone" />
                  <Button disabled={isPending || !query.trim()} onClick={searchDrivers} className="gap-2">
                    <Search className="h-4 w-4" /> Search
                  </Button>
                </div>
                <div className="mt-4 grid gap-3">
                  {searchResults.map((driver) => (
                    <div key={driver.id} className="flex flex-col gap-3 rounded-md border border-slate-200 p-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-full bg-slate-100">
                          {driver.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={driver.image} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <Car className="h-6 w-6 text-slate-500" aria-hidden="true" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-semibold">{driver.full_name}</p>
                          <p className="text-xs text-slate-500">{driver.shareId || "No share ID"} · {driver.vehicle || "Vehicle pending"}</p>
                        </div>
                      </div>
                      <div className="flex shrink-0 flex-wrap items-center gap-2">
                        {driver.existingConnection && (
                          <StatusBadge status={driver.existingConnection.status} />
                        )}
                        {driver.existingConnection?.status === "REVOKED" ? (
                          <Button size="sm" disabled={isPending} onClick={() => setRequestAgainTarget(driver)}>
                            Request again
                          </Button>
                        ) : (
                          <Button size="sm" disabled={isPending || !!driver.existingConnection} onClick={() => requestDriver(driver.id)}>
                            {driver.existingConnection ? driver.existingConnection.status.replaceAll("_", " ") : "Request"}
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                  {!searchResults.length && <p className="rounded-md bg-slate-50 p-3 text-sm text-slate-500">Search for a driver you already know.</p>}
                </div>
              </section>

              <section className="rounded-lg border border-slate-200 p-4">
                <h3 className="mb-3 text-base font-semibold">Invite unregistered driver</h3>
                <div className="grid gap-2">
                  <Input className={inputClass} value={inviteForm.email} onChange={(event: ChangeEvent<HTMLInputElement>) => setInviteForm((current) => ({ ...current, email: event.target.value }))} placeholder="Driver email" />
                  <Input className={inputClass} value={inviteForm.phoneNumber} onChange={(event: ChangeEvent<HTMLInputElement>) => setInviteForm((current) => ({ ...current, phoneNumber: event.target.value }))} placeholder="Driver phone" />
                  <Button disabled={isPending || (!inviteForm.email.trim() && !inviteForm.phoneNumber.trim())} onClick={inviteDriver} className="gap-2">
                    <MailPlus className="h-4 w-4" /> Send invite
                  </Button>
                </div>
              </section>
            </div>
          </div>
        </div>
      )}

      {addKidOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/40 p-0 sm:items-center sm:p-4">
          <div className="w-full max-w-xl rounded-t-xl bg-white p-4 shadow-2xl sm:rounded-xl">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">Add kid</h2>
              <button type="button" onClick={() => setAddKidOpen(false)} className="rounded-md p-2 hover:bg-slate-100" aria-label="Close add kid">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Input className={inputClass} value={childForm.fullName} onChange={(event) => setChildForm((current) => ({ ...current, fullName: event.target.value }))} placeholder="Child name" />
              <Input className={inputClass} value={childForm.age} onChange={(event) => setChildForm((current) => ({ ...current, age: event.target.value }))} placeholder="Age" type="number" />
              <Input className={inputClass} value={childForm.grade} onChange={(event) => setChildForm((current) => ({ ...current, grade: event.target.value }))} placeholder="Grade" />
              <Input className={inputClass} value={childForm.address} onChange={(event) => setChildForm((current) => ({ ...current, address: event.target.value }))} placeholder="School address" />
            </div>
            <Button className="mt-4" disabled={isPending || !childForm.fullName.trim()} onClick={addChild}>
              Add kid
            </Button>
          </div>
        </div>
      )}

      {locationAssignment && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/40 p-0 sm:items-center sm:p-4">
          <div className="w-full max-w-2xl rounded-t-xl bg-white p-4 shadow-2xl sm:rounded-xl">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">Driver location</h2>
                <p className="text-sm text-slate-500">{locationAssignment.driver.full_name} · {locationAssignment.child.fullName}</p>
              </div>
              <button type="button" onClick={() => setLocationAssignment(null)} className="rounded-md p-2 hover:bg-slate-100" aria-label="Close map">
                <X className="h-5 w-5" />
              </button>
            </div>
            <DriverLocationMap assignment={locationAssignment} />
          </div>
        </div>
      )}

      {revokeTarget && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/40 p-0 sm:items-center sm:p-4">
          <div className="w-full max-w-lg rounded-t-xl bg-white p-4 shadow-2xl sm:rounded-xl">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">Revoke driver access</h2>
                <p className="text-sm text-slate-500">{revokeTarget.driver.full_name}</p>
              </div>
              <button type="button" onClick={closeRevokeModal} className="rounded-md p-2 hover:bg-slate-100" aria-label="Close revoke driver">
                <X className="h-5 w-5" />
              </button>
            </div>
            <textarea
              className="min-h-28 w-full resize-none rounded-md border border-slate-200 bg-white p-3 text-sm text-slate-900 outline-none focus:border-slate-400"
              value={revokeReason}
              onChange={(event) => setRevokeReason(event.target.value)}
              placeholder="Reason for revoking this driver's access"
            />
            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" disabled={isPending} onClick={closeRevokeModal}>
                Cancel
              </Button>
              <Button type="button" disabled={isPending || revokeReason.trim().length < 5} onClick={revokeConnection} className="gap-2">
                <Trash2 className="h-4 w-4" /> Revoke access
              </Button>
            </div>
          </div>
        </div>
      )}

      {requestAgainTarget && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-slate-950/40 p-0 sm:items-center sm:p-4">
          <div className="w-full max-w-lg rounded-t-xl bg-white p-4 shadow-2xl sm:rounded-xl">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">Request driver again?</h2>
                <p className="text-sm text-slate-500">{requestAgainTarget.full_name}</p>
              </div>
              <button type="button" onClick={() => setRequestAgainTarget(null)} className="rounded-md p-2 hover:bg-slate-100" aria-label="Close request driver again">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
              You revoked this driver due to: {requestAgainTarget.existingConnection?.note || "No reason recorded"}.
            </div>
            <p className="mt-3 text-sm text-slate-600">Are you sure you want to add this driver again?</p>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" disabled={isPending} onClick={() => setRequestAgainTarget(null)}>
                Search another driver
              </Button>
              <Button type="button" disabled={isPending} onClick={() => requestDriver(requestAgainTarget.id)}>
                Yes, request again
              </Button>
            </div>
          </div>
        </div>
      )}

      {assignmentConfirmTarget && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-slate-950/40 p-0 sm:items-center sm:p-4">
          <div className="w-full max-w-lg rounded-t-xl bg-white p-4 shadow-2xl sm:rounded-xl">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">Assign kids to this driver?</h2>
                <p className="text-sm text-slate-500">{assignmentConfirmTarget.driver.full_name}</p>
              </div>
              <button type="button" onClick={() => setAssignmentConfirmTarget(null)} className="rounded-md p-2 hover:bg-slate-100" aria-label="Close assignment confirmation">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
              You previously revoked this driver due to: {assignmentConfirmTarget.note || "No reason recorded"}.
            </div>
            <p className="mt-3 text-sm text-slate-600">Are you sure you want to assign kids to this driver again?</p>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" disabled={isPending} onClick={() => setAssignmentConfirmTarget(null)}>
                Cancel
              </Button>
              <Button
                type="button"
                disabled={isPending}
                onClick={() => {
                  saveChildAssignments(assignmentConfirmTarget.id);
                  setAssignmentConfirmTarget(null);
                }}
              >
                Yes, save assignments
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="mx-auto grid w-full max-w-7xl gap-5 px-4 py-6">
        <header className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">Known driver network</p>
          <h1 className="text-2xl font-semibold">Welcome{parentName ? `, ${parentName}` : ""}</h1>
          <p className="mt-1 text-sm text-slate-500">
            Track your kids with approved drivers. Add drivers from the top bar when you need to connect someone new.
          </p>
        </header>

        <section className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="mb-3 text-base font-semibold">Approved drivers and child assignments</h2>
          <div className="grid gap-4">
            {approvedConnections.map((connection) => {
              const selected = selectedChildrenByConnection[connection.id] || [];
              const assignedChildIds = new Set(
                connection.assignments
                  .filter((assignment) => assignment.status === "ACTIVE")
                  .map((assignment) => assignment.child.id)
              );

              return (
                <div key={connection.id} className="rounded-md border border-slate-200 p-3">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="truncate font-semibold">{connection.driver.full_name}</h3>
                        {connection.driver.verificationStatus === "VERIFIED" && <BadgeCheck className="h-5 w-5 text-emerald-600" aria-label="Verified" />}
                      </div>
                      <p className="text-xs text-slate-500">{connection.driver.shareProfile?.shareId || connection.driver.shareId || "No share ID"}</p>
                    </div>
                    <Button size="sm" variant="outline" disabled={isPending} onClick={() => openRevokeModal(connection)} className="gap-2">
                      <Trash2 className="h-4 w-4" /> Revoke
                    </Button>
                  </div>

                  <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {children.map((child) => (
                      <label key={child.id} className={`flex cursor-pointer items-center gap-3 rounded-md border p-3 ${selected.includes(child.id) || assignedChildIds.has(child.id) ? "border-emerald-200 bg-emerald-50" : "border-slate-200"}`}>
                        <input type="checkbox" checked={selected.includes(child.id) || assignedChildIds.has(child.id)} disabled={assignedChildIds.has(child.id)} onChange={() => toggleChild(connection.id, child.id)} />
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium">{child.fullName}</span>
                          <span className="block truncate text-xs text-slate-500">{child.address || child.grade || "No school address"}</span>
                        </span>
                      </label>
                    ))}
                  </div>
                  <Button className="mt-3" size="sm" disabled={isPending || !selected.length} onClick={() => assignChildren(connection)}>
                    Save child assignments
                  </Button>
                </div>
              );
            })}
            {!approvedConnections.length && <p className="rounded-md bg-slate-50 p-3 text-sm text-slate-500">Approve a driver from the side menu before assigning kids.</p>}
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="mb-3 text-base font-semibold">My kids</h2>
          <div className="grid gap-3">
            {children.map((child) => {
              const childAssignments = activeAssignments.filter((assignment) => assignment.child.id === child.id);
              const assignment = childAssignments[0];
              const extraDrivers = Math.max(childAssignments.length - 1, 0);

              return (
                <div key={child.id} className="flex flex-col gap-3 rounded-md border border-slate-200 p-3 md:flex-row md:items-center md:justify-between">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-full bg-slate-100">
                      {child.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={child.image} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <UserRound className="h-6 w-6 text-slate-500" aria-hidden="true" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{child.fullName}</p>
                      {assignment ? (
                        <>
                          <p className="text-xs text-slate-500">
                            Driver: {assignment.driver.full_name}
                            {extraDrivers ? ` + ${extraDrivers} more` : ""}
                          </p>
                          <p className="text-xs text-slate-500">Last status: {(assignment.lastStatus || "Waiting").replaceAll("_", " ")}</p>
                          <p className="text-xs font-semibold text-slate-700">{childPlaceLabel(assignment)}</p>
                        </>
                      ) : (
                        <>
                          <p className="text-xs text-slate-500">{child.address || child.grade || "No school address"}</p>
                          <p className="text-xs font-semibold text-slate-700">No driver assigned</p>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {assignment ? (
                      <>
                        <StatusBadge status={assignment.billingStatus} />
                        <span className="text-xs text-slate-500">Trial ends {formatDate(assignment.trialEndsAt)}</span>
                        {assignment.driver.phoneNumber && (
                          <Button size="sm" variant="outline" asChild className="gap-2">
                            <a href={`tel:${assignment.driver.phoneNumber}`}>
                              <Phone className="h-4 w-4" /> Call driver
                            </a>
                          </Button>
                        )}
                        {assignment.driver.liveAddress ? (
                          <Button size="sm" variant="outline" onClick={() => setLocationAssignment(assignment)} className="gap-2">
                            <MapPin className="h-4 w-4" /> View location
                          </Button>
                        ) : (
                          <Button size="sm" variant="outline" disabled={isPending} onClick={() => requestLocation(assignment.id)} className="gap-2">
                            <MapPin className="h-4 w-4" /> Request location
                          </Button>
                        )}
                        {/* <Button size="sm" variant="outline" disabled={isPending} onClick={() => initializePayment(assignment.id)} className="gap-2">
                          <CreditCard className="h-4 w-4" /> Pay monthly
                        </Button> */}
                      </>
                    ) : (
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">UNASSIGNED</span>
                    )}
                  </div>
                </div>
              );
            })}
            {!children.length && (
              <p className="rounded-md bg-slate-50 p-3 text-sm text-slate-500">
                Added kids will appear here.
              </p>
            )}
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex items-start gap-3 text-sm text-slate-600">
            <ShieldCheck className="mt-0.5 h-5 w-5 text-emerald-600" aria-hidden="true" />
            <p>Drivers can only see child details after you approve the relationship and assign specific kids.</p>
          </div>
        </section>
      </div>
    </main>
  );
}
