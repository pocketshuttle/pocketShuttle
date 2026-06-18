"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { BadgeCheck, Car, Check, Clock3, CreditCard, MapPin, Phone, Save, ShieldCheck, Trash2, UserRound, UsersRound, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import { AddDriverModal } from "@/components/parent-view/standalone/add-driver-modal";
import { DriverLocationMap } from "@/components/parent-view/standalone/driver-location-map";
import { ParentSideMenu } from "@/components/parent-view/standalone/parent-side-menu";
import { StatusBadge } from "@/components/parent-view/standalone/status-badge";
import type { AssignmentWithDriver, Child, Connection, DriverSummary, Invite } from "@/components/parent-view/standalone/types";
import { childPlaceLabel, formatDate, formatRelativeActivity, inputClass, jsonFetch, schoolKey } from "@/components/parent-view/standalone/utils";
import { pusherClient } from "@/pusher/client";

type Props = {
  parentId: string;
  parentName?: string | null;
  childrenData: Child[];
  connectionsData: Connection[];
  invitesData: Invite[];
};

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
  const [sharedSchoolAddressByKey, setSharedSchoolAddressByKey] = useState<Record<string, boolean>>({});
  const [sideMenuOpen, setSideMenuOpen] = useState(false);
  const [addDriverOpen, setAddDriverOpen] = useState(false);
  const [addKidOpen, setAddKidOpen] = useState(false);
  const [editingChildId, setEditingChildId] = useState<string | null>(null);
  const [locationAssignment, setLocationAssignment] = useState<AssignmentWithDriver | null>(null);
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
  const schoolCoordsByAddress = useMemo(() => {
    const coordsByAddress = new globalThis.Map<string, { latitude: number; longitude: number }>();
    for (const child of children) {
      const key = schoolKey(child.address);
      if (key && child.schoolCoords) {
        coordsByAddress.set(key, child.schoolCoords);
      }
    }
    return coordsByAddress;
  }, [children]);

  const isSharedSchoolAddressOn = (key: string) => sharedSchoolAddressByKey[key] ?? true;

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
    const openAddKid = () => {
      setEditingChildId(null);
      setChildForm({ fullName: "", age: "", grade: "", address: "" });
      setAddKidOpen(true);
    };

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
        const data = await jsonFetch(editingChildId ? `/api/parent/children/${editingChildId}` : "/api/parent/children", {
          method: editingChildId ? "PATCH" : "POST",
          body: JSON.stringify({
            ...childForm,
            age: childForm.age ? Number(childForm.age) : undefined,
          }),
        });
        setChildren((current) =>
          editingChildId
            ? current.map((child) => {
              if (child.id === editingChildId) return data.child;
              if (data.schoolCoordinateUpdate?.childIds?.includes(child.id)) {
                return { ...child, schoolCoords: data.schoolCoordinateUpdate.schoolCoords };
              }
              return child;
            })
            : [data.child, ...current]
        );
        setChildForm({ fullName: "", age: "", grade: "", address: "" });
        setEditingChildId(null);
        setAddKidOpen(false);
        toast({ description: data.message });
      } catch (error) {
        toast({ description: error instanceof Error ? error.message : "Unable to save child", variant: "destructive" });
      }
    });
  };

  const editChildSchoolAddress = (child: Child) => {
    setEditingChildId(child.id);
    setChildForm({
      fullName: child.fullName || "",
      age: child.age ? String(child.age) : "",
      grade: child.grade || "",
      address: child.address || "",
    });
    setAddKidOpen(true);
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

  const setChildGroupSelection = (connectionId: string, childIds: string[], enabled: boolean) => {
    setSelectedChildrenByConnection((current) => {
      const selected = current[connectionId] || [];

      return {
        ...current,
        [connectionId]: enabled
          ? Array.from(new Set([...selected, ...childIds]))
          : selected.filter((childId) => !childIds.includes(childId)),
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

      <ParentSideMenu
        open={sideMenuOpen}
        parentName={parentName}
        billingSummary={billingSummary}
        pendingConnections={pendingConnections}
        approvedConnections={approvedConnections}
        invites={invites}
        isPending={isPending}
        onClose={() => setSideMenuOpen(false)}
        onApproveConnection={approveConnection}
        onRevokeConnection={openRevokeModal}
      />

      {addDriverOpen && (
        <AddDriverModal
          query={query}
          searchResults={searchResults}
          inviteForm={inviteForm}
          isPending={isPending}
          onClose={() => setAddDriverOpen(false)}
          onQueryChange={setQuery}
          onInviteFormChange={setInviteForm}
          onSearchDrivers={searchDrivers}
          onRequestDriver={requestDriver}
          onRequestAgain={setRequestAgainTarget}
          onInviteDriver={inviteDriver}
        />
      )}

      {addKidOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/40 p-0 sm:items-center sm:p-4">
          <div className="w-full max-w-xl rounded-t-xl bg-white p-4 shadow-2xl sm:rounded-xl">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">{editingChildId ? "Edit school address" : "Add kid"}</h2>
              <button
                type="button"
                onClick={() => {
                  setAddKidOpen(false);
                  setEditingChildId(null);
                  setChildForm({ fullName: "", age: "", grade: "", address: "" });
                }}
                className="rounded-md p-2 hover:bg-slate-100"
                aria-label="Close add kid"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Input className={inputClass} value={childForm.fullName} onChange={(event) => setChildForm((current) => ({ ...current, fullName: event.target.value }))} placeholder="Child name" />
              <Input className={inputClass} value={childForm.age} onChange={(event) => setChildForm((current) => ({ ...current, age: event.target.value }))} placeholder="Age" type="number" />
              <Input className={inputClass} value={childForm.grade} onChange={(event) => setChildForm((current) => ({ ...current, grade: event.target.value }))} placeholder="Grade" />
              <Input className={inputClass} value={childForm.address} onChange={(event) => setChildForm((current) => ({ ...current, address: event.target.value }))} placeholder="School address" />
            </div>
            <Button className="mt-4" disabled={isPending || !childForm.fullName.trim() || !childForm.address.trim()} onClick={addChild}>
              {editingChildId ? "Save school address" : "Add kid"}
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

      <div className="mx-auto grid w-full max-w-7xl gap-4 px-4 py-4">
        <header className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <div className="grid gap-4 p-4 sm:grid-cols-[1fr_13rem] sm:items-center">
            <div>
              <p className="text-xs font-medium uppercase text-slate-500">Known driver network</p>
              <h1 className="mt-1 text-xl font-semibold">Welcome{parentName ? `, ${parentName}` : ""}</h1>
              <p className="mt-1 max-w-2xl text-sm text-slate-500">
                Track your kids with approved drivers. Add drivers from the top bar when you need to connect someone new.
              </p>
            </div>
            <div className="hidden h-28 overflow-hidden rounded-md bg-slate-100 sm:block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/family.jpg" alt="" className="h-full w-full object-cover" />
            </div>
          </div>
        </header>

        <section className="rounded-lg  bg-white p-4">
          {/* <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Approved drivers and child assignments</h2>
              <p className="mt-1 text-sm text-slate-500">Manage which children each driver can see and track.</p>
            </div>
            <span className="hidden rounded-full bg-emerald-50 p-3 text-emerald-700 sm:grid">
              <ShieldCheck className="h-6 w-6" aria-hidden="true" />
            </span>
          </div> */}
          <div className="grid gap-4">
            {approvedConnections.map((connection) => {
              const selected = selectedChildrenByConnection[connection.id] || [];
              const assignedChildIds = new Set(
                connection.assignments
                  .filter((assignment) => assignment.status === "ACTIVE")
                  .map((assignment) => assignment.child.id)
              );
              const schoolGroups = Array.from(
                children
                  .reduce((groups, child) => {
                    const label = child.address?.trim() || child.grade?.trim() || "School not set";
                    const key = label.toLowerCase();
                    const group = groups.get(key) || { label, children: [] as Child[] };
                    group.children.push(child);
                    groups.set(key, group);
                    return groups;
                  }, new globalThis.Map<string, { label: string; children: Child[] }>())
                  .values()
              );
              const showSchoolGroups = schoolGroups.some((group) => group.children.length > 1);

              return (
                <div key={connection.id} className="rounded-md ">
                  <div className="flex flex-col gap-3 rounded-md border border-slate-200 bg-white p-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-full bg-slate-100">
                        {connection.driver.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={connection.driver.image} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <Car className="h-6 w-6 text-slate-500" aria-hidden="true" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="truncate text-lg font-semibold">{connection.driver.full_name}</h3>
                          {connection.driver.verificationStatus === "VERIFIED" && <BadgeCheck className="h-5 w-5 text-emerald-600" aria-label="Verified" />}
                        </div>
                        <div className="py-1 space-x-7">
                          <span className="rounded-md bg-indigo-50 px-2 py-1 font-medium text-indigo-700 text-sm">{connection.driver.shareProfile?.shareId || connection.driver.shareId || "No share ID"}</span>
                          <Button size="sm" variant="outline" disabled={isPending} onClick={() => openRevokeModal(connection)} className="gap-1 border-rose-200 text-rose-700 hover:bg-rose-50">
                            <Trash2 className="h-4 w-4" /> Revoke
                          </Button>
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-[0.65rem] text-slate-500">
                          <span className="inline-flex items-center gap-1"><ShieldCheck className="h-3.5 w-3.5" /> Approved driver</span>
                          <span className="inline-flex items-center gap-1"><Clock3 className="h-3.5 w-3.5" /> {formatRelativeActivity(connection.driver.lastActiveAt)}</span>
                        </div>
                      </div>
                    </div>

                  </div>

                  {showSchoolGroups && (
                    <div className="mt-4 grid gap-2">
                      {schoolGroups
                        .filter((group) => group.children.length > 1)
                        .map((group) => {
                          const groupKey = schoolKey(group.label);
                          const groupChildIds = group.children.map((child) => child.id);
                          const availableChildIds = group.children
                            .map((child) => child.id)
                            .filter((childId) => !assignedChildIds.has(childId));
                          const checked = isSharedSchoolAddressOn(groupKey);
                          const nextChecked = !checked;
                          const allAlreadyAssigned =
                            groupChildIds.length > 0 &&
                            groupChildIds.every((childId) => assignedChildIds.has(childId));

                          return (
                            <button
                              key={group.label}
                              type="button"
                              role="switch"
                              aria-checked={checked}
                              onClick={() => {
                                setSharedSchoolAddressByKey((current) => ({ ...current, [groupKey]: nextChecked }));
                                setChildGroupSelection(connection.id, availableChildIds, nextChecked);
                              }}
                              className={`flex items-center justify-between gap-3 rounded-md border p-3 text-left transition ${checked ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-white hover:bg-slate-50"
                                }`}
                            >
                              <span className="flex min-w-0 items-center gap-3">
                                <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${checked ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                                  <UsersRound className="h-5 w-5" aria-hidden="true" />
                                </span>
                                <span className="min-w-0">
                                  <span className="block truncate text-sm font-medium">
                                    {schoolGroups.length === 1 ? "Assign all linked students" : `${group.children.length} students at this school`}
                                  </span>
                                  <span className="block truncate text-xs text-slate-500">
                                    {allAlreadyAssigned ? `${group.label} · already assigned` : group.label}
                                  </span>
                                </span>
                              </span>
                              <span className={`flex h-7 w-12 shrink-0 items-center rounded-full p-0.5 transition-colors ${checked ? "bg-emerald-600" : "bg-slate-300"}`}>
                                <span className={`h-6 w-6 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-5" : "translate-x-0"}`} />
                              </span>
                            </button>
                          );
                        })}
                    </div>
                  )}

                  <div className="mt-4 rounded-md border border-slate-200 p-3">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <h3 className="text-sm font-medium">Children assigned to driver</h3>
                      <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                        {assignedChildIds.size + selected.length} selected
                      </span>
                    </div>
                    <div className="grid gap-2">
                      {children.map((child) => {
                        const checked = selected.includes(child.id) || assignedChildIds.has(child.id);
                        return (
                          <label key={child.id} className={`flex cursor-pointer items-center gap-3 rounded-md border p-3 ${checked ? "border-emerald-200 bg-emerald-50" : "border-slate-200"}`}>
                            <input type="checkbox" checked={checked} disabled={assignedChildIds.has(child.id)} onChange={() => toggleChild(connection.id, child.id)} />
                            <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full bg-slate-100">
                              {child.image ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={child.image} alt="" className="h-full w-full object-cover" />
                              ) : (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src="/images/child.jpg" alt="" className="h-full w-full object-cover" />
                              )}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-medium">{child.fullName}</span>
                              <span className="block truncate text-xs text-slate-500">{child.address || "No school address"}{child.grade ? ` · ${child.grade}` : ""}</span>
                            </span>
                            {checked && (
                              <span className="hidden rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700 sm:inline-flex">
                                <Check className="mr-1 h-3.5 w-3.5" /> Assigned
                              </span>
                            )}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                  <div className="mt-4 flex flex-col gap-3 rounded-md border border-indigo-100 bg-indigo-50/50 p-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3 text-sm text-slate-600">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-indigo-700">
                        <ShieldCheck className="h-5 w-5" aria-hidden="true" />
                      </span>
                      <p>Only approved drivers can view information for assigned children.</p>
                    </div>
                    <Button className="gap-2" size="sm" disabled={isPending || !selected.length} onClick={() => assignChildren(connection)}>
                      <Save className="h-4 w-4" /> Save assignments
                    </Button>
                  </div>
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
              const childSchoolKey = schoolKey(child.address);
              const effectiveSchoolCoords =
                child.schoolCoords ||
                (isSharedSchoolAddressOn(childSchoolKey) ? schoolCoordsByAddress.get(childSchoolKey) : null) ||
                null;

              return (
                <div key={child.id} className="flex flex-col gap-3 rounded-md border border-slate-200 p-3 md:flex-row md:items-center md:justify-between">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-full bg-slate-100">
                      {child.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={child.image} alt="" className="h-full w-full object-cover" />
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src="/images/child.jpg" alt="" className="h-full w-full object-cover" />
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
                      {!effectiveSchoolCoords && (
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          <p className="text-xs font-medium text-amber-700">School location missing</p>
                          <Button size="sm" variant="outline" onClick={() => editChildSchoolAddress(child)} className="h-7 px-2 text-xs">
                            Edit
                          </Button>
                        </div>
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
