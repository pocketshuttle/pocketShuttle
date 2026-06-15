"use client";

import { ChangeEvent, useEffect, useRef, useState, useTransition } from "react";
import { BadgeCheck, Car, Check, CircleSlash, Copy, Crosshair, FileBadge, ImagePlus, LockKeyhole, MapPin, Phone, Upload, UserRound, X } from "lucide-react";

import Logout from "@/components/dashboard/sidebar/logout";
import NotificationFeed from "@/components/knock/notitification-feed";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";

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
    image?: string | null;
  };
  events?: Array<{ id: string; eventType: string; createdAt: string | Date }>;
};

type Connection = {
  id: string;
  status: string;
  parent: {
    id: string;
    full_name?: string | null;
    phoneNumber?: string | null;
    image?: string | null;
  };
  assignments: Assignment[];
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

type Props = {
  driver: Driver;
  connectionsData: Connection[];
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

export function StandaloneDriverDashboard({ driver, connectionsData }: Props) {
  const [connections, setConnections] = useState(connectionsData);
  const [verification, setVerification] = useState({
    image: driver.image || "",
    phoneNumber: driver.phoneNumber || "",
    address: driver.address || "",
    liveAddress: driver.liveAddress || null,
    landmark: driver.landmark || "",
    utilityBillUrl: driver.utilityBillUrl || "",
    identityDocumentUrl: driver.identityDocumentUrl || "",
  });
  const [verificationStatus, setVerificationStatus] = useState(driver.verificationStatus);
  const [uploadingField, setUploadingField] = useState<"image" | "utilityBillUrl" | "identityDocumentUrl" | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [liveSharingOn, setLiveSharingOn] = useState(false);
  const [lastSharedAt, setLastSharedAt] = useState<string | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const [isPending, startTransition] = useTransition();

  const verified = verificationStatus === "VERIFIED";
  const verificationLocked = verified;
  const shareId = driver.shareProfile?.shareId || "Generating";
  const vehicleName = [driver.carColor, driver.carMake, driver.carModel].filter(Boolean).join(" ");
  const approvedConnections = connections.filter((connection) => connection.status === "PARENT_APPROVED");
  const pendingConnections = connections.filter((connection) => connection.status !== "PARENT_APPROVED");
  const assignments = approvedConnections.flatMap((connection) =>
    connection.assignments.map((assignment) => ({ ...assignment, parent: connection.parent }))
  );

  const copyShareId = async () => {
    await navigator.clipboard.writeText(shareId);
    toast({ description: "Driver share ID copied." });
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
        postLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          continuous: true,
        }).catch((error) => {
          toast({ description: error instanceof Error ? error.message : "Unable to share location", variant: "destructive" });
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

  const submitVerification = () => {
    startTransition(async () => {
      try {
        const data = await jsonFetch("/api/driver/verification", {
          method: "PATCH",
          body: JSON.stringify(verification),
        });
        setVerificationStatus(data.driver.verificationStatus);
        toast({ description: data.message });
      } catch (error) {
        toast({
          description: error instanceof Error ? error.message : "Unable to submit verification",
          variant: "destructive",
        });
      }
    });
  };

  const uploadVerificationFile = async (
    event: ChangeEvent<HTMLInputElement>,
    field: "image" | "utilityBillUrl" | "identityDocumentUrl"
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingField(field);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append(
        "purpose",
        field === "image"
          ? "driver-avatar"
          : field === "utilityBillUrl"
            ? "driver-utility-bill"
            : "driver-identity-document"
      );

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.message || "Unable to upload file");
      }

      setVerification((current) => ({ ...current, [field]: data.url }));
      toast({ description: "File uploaded." });
    } catch (error) {
      toast({
        description: error instanceof Error ? error.message : "Unable to upload file",
        variant: "destructive",
      });
    } finally {
      setUploadingField(null);
    }
  };

  const markChildStatus = (assignmentId: string, action: "on_the_way" | "picked_up" | "dropped_off") => {
    startTransition(async () => {
      try {
        const data = await jsonFetch(`/api/child-driver-assignments/${assignmentId}/status`, {
          method: "PATCH",
          body: JSON.stringify({ action }),
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
        className={`fixed inset-y-0 left-0 z-50 flex w-[min(92vw,420px)] flex-col overflow-y-auto border-r border-slate-200 bg-white shadow-2xl transition-transform duration-300 ${
          settingsOpen ? "translate-x-0" : "-translate-x-full"
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
              <p className="text-xs text-slate-500">{verificationStatus.replace("_", " ")}</p>
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
            <h2 className="mb-4 text-base font-semibold">Verification</h2>
            <div className="grid gap-3">
              <div className="flex items-center gap-3 rounded-md border border-slate-200 p-3">
                <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-full bg-slate-100">
                  {verification.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={verification.image} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <UserRound className="h-8 w-8 text-slate-500" aria-hidden="true" />
                  )}
                </div>
                <label className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-800 hover:bg-slate-50">
                  <ImagePlus className="h-4 w-4" aria-hidden="true" />
                  {uploadingField === "image" ? "Uploading..." : "Upload image"}
                  <input type="file" accept="image/*" className="sr-only" disabled={verificationLocked || !!uploadingField || isPending} onChange={(event) => uploadVerificationFile(event, "image")} />
                </label>
              </div>
              <Input className={inputClass} placeholder="Phone number" value={verification.phoneNumber} disabled={verificationLocked} onChange={(event) => setVerification((current) => ({ ...current, phoneNumber: event.target.value }))} />
              <Input className={inputClass} placeholder="Address" value={verification.address} disabled={verificationLocked} onChange={(event) => setVerification((current) => ({ ...current, address: event.target.value }))} />
              <Input className={inputClass} placeholder="Landmark" value={verification.landmark} disabled={verificationLocked} onChange={(event) => setVerification((current) => ({ ...current, landmark: event.target.value }))} />
              <div className="grid gap-2 rounded-md border border-slate-200 p-3">
                <p className="truncate text-xs text-slate-500">{verification.utilityBillUrl || "No utility bill uploaded"}</p>
                <label className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-800 hover:bg-slate-50">
                  <Upload className="h-4 w-4" aria-hidden="true" />
                  {uploadingField === "utilityBillUrl" ? "Uploading..." : "Upload utility bill"}
                  <input type="file" accept="image/*" className="sr-only" disabled={verificationLocked || !!uploadingField || isPending} onChange={(event) => uploadVerificationFile(event, "utilityBillUrl")} />
                </label>
              </div>
              <div className="grid gap-2 rounded-md border border-slate-200 p-3">
                <p className="truncate text-xs text-slate-500">{verification.identityDocumentUrl || "No passport page or NIN card uploaded"}</p>
                <label className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-800 hover:bg-slate-50">
                  <FileBadge className="h-4 w-4" aria-hidden="true" />
                  {uploadingField === "identityDocumentUrl" ? "Uploading..." : "Upload passport/NIN"}
                  <input type="file" accept="image/*" className="sr-only" disabled={verificationLocked || !!uploadingField || isPending} onChange={(event) => uploadVerificationFile(event, "identityDocumentUrl")} />
                </label>
              </div>
              <Button type="button" variant="outline" disabled={verificationLocked} onClick={() => captureLocation(false)} className="gap-2">
                <Crosshair className="h-4 w-4" aria-hidden="true" /> Share GPS
              </Button>
              {verificationLocked ? (
                <p className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-700">Your account is verified. Verification details are locked.</p>
              ) : (
                <Button disabled={isPending} onClick={submitVerification}>Submit for review</Button>
              )}
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
            <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full [&_button]:h-10 [&_button]:w-10 [&_button]:rounded-full">
              <NotificationFeed />
            </span>
            <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full hover:bg-slate-100 [&_button]:h-10 [&_button]:w-10 [&_button]:justify-center [&_button]:gap-0 [&_button]:rounded-full [&_button]:p-0 [&_svg]:h-5 [&_svg]:w-5">
              <Logout />
            </span>
          </div>
        </div>
      </nav>

      <div className="mx-auto grid w-full max-w-7xl gap-5 px-4 py-6">
        <section className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-sm text-slate-500">Approved families</p>
            <p className="mt-2 text-3xl font-semibold">{approvedConnections.length}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-sm text-slate-500">Assigned kids</p>
            <p className="mt-2 text-3xl font-semibold">{assignments.length}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-sm text-slate-500">Pending relationships</p>
            <p className="mt-2 text-3xl font-semibold">{pendingConnections.length}</p>
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-semibold">Share live location</h2>
              <p className="text-sm text-slate-500">Parents with approved assigned kids can see your latest active location.</p>
            </div>
            <div className="flex flex-wrap gap-2">
            <Button disabled={isPending} onClick={() => captureLocation(false)} className="gap-2">
              <Crosshair className="h-4 w-4" /> Share location now
            </Button>
            <Button
              disabled={isPending}
              variant={liveSharingOn ? "default" : "outline"}
              onClick={toggleLiveSharing}
              className="gap-2"
            >
              <MapPin className="h-4 w-4" />
              {liveSharingOn ? "Live location on" : "Keep live location on"}
            </Button>
            </div>
          </div>
          <p className="rounded-md bg-slate-50 p-3 text-sm text-slate-500">
            {verification.liveAddress
              ? `Latest location: ${verification.liveAddress.latitude}, ${verification.liveAddress.longitude}`
              : "No live GPS shared yet."}
            {lastSharedAt ? ` · shared ${formatDateTime(lastSharedAt)}` : ""}
          </p>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="mb-4 text-base font-semibold">Pending parent relationships</h2>
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
                  </div>
                </div>
                <StatusBadge status={connection.status} />
              </div>
            ))}
            {!pendingConnections.length && <p className="rounded-md bg-slate-50 p-3 text-sm text-slate-500">No pending parent relationships.</p>}
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
                      <p className="flex items-center gap-1 text-xs text-slate-500">
                        <MapPin className="h-3.5 w-3.5" /> {assignment.child.address || "No school address"}
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
      </div>
    </main>
  );
}
