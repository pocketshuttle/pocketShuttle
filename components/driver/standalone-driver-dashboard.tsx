"use client";

import { ChangeEvent, useState, useTransition } from "react";
import { APIProvider, AdvancedMarker, Map, Pin } from "@vis.gl/react-google-maps";
import { BadgeCheck, Car, Check, CircleSlash, Clock3, Crosshair, FileBadge, ImagePlus, LockKeyhole, MapPin, Phone, Upload, UserRound, X } from "lucide-react";

import Logout from "@/components/dashboard/sidebar/logout";
import NotificationFeed from "@/components/knock/notitification-feed";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";

type DriverRequest = {
  id: string;
  status: string;
  createdAt?: string | Date | null;
  respondedAt?: string | Date | null;
  pickedUpAt?: string | Date | null;
  droppedOffAt?: string | Date | null;
  routeArea?: string | null;
  note?: string | null;
  child: {
    id: string;
    fullName: string;
    age?: number | null;
    grade?: string | null;
    address?: string | null;
    image?: string | null;
  };
  parent: {
    id: string;
    full_name?: string | null;
    phoneNumber?: string | null;
    address?: string | null;
    image?: string | null;
  };
  parentPickupCount?: number;
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
};

type Props = {
  driver: Driver;
  requestsData: DriverRequest[];
};

const inputClass =
  "h-10 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-none";

const statusStyles: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-700",
  ACCEPTED: "bg-blue-50 text-blue-700",
  DECLINED: "bg-rose-50 text-rose-700",
  CANCELLED: "bg-slate-100 text-slate-600",
};

function formatDateTime(value?: string | Date | null) {
  if (!value) return null;
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function getTripStatusLabel(request: DriverRequest) {
  if (request.droppedOffAt) return "DROPPED OFF";
  if (request.pickedUpAt) return "PICKED UP";
  return request.status.replace("_", " ");
}

function DriverRouteMap({ driverLocation, request }: {
  driverLocation?: { latitude: number; longitude: number } | null;
  request?: DriverRequest | null;
}) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const center = driverLocation
    ? { lat: driverLocation.latitude, lng: driverLocation.longitude }
    : { lat: 6.5244, lng: 3.3792 };
  const showSchool = !!request?.pickedUpAt;
  const destinationLabel = showSchool ? request?.child.address : request?.parent.address;

  if (!apiKey) {
    return (
      <div className="grid h-72 place-items-center rounded-lg bg-slate-100 px-4 text-center text-sm text-slate-500">
        Map is unavailable right now.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200">
      <div className="h-72">
        <APIProvider apiKey={apiKey}>
          <Map
            defaultCenter={center}
            defaultZoom={driverLocation ? 13 : 10}
            mapId={process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID}
            fullscreenControl={false}
            streetViewControl={false}
            mapTypeControl={false}
          >
            {driverLocation && (
              <AdvancedMarker position={center} title="Your current location">
                <Pin background="#111827" borderColor="#ffffff" glyphColor="#ffffff" />
              </AdvancedMarker>
            )}
          </Map>
        </APIProvider>
      </div>
      <div className="border-t border-slate-200 bg-white p-3 text-sm text-slate-600">
        {request ? (
          <p>
            {showSchool ? "Destination school" : "Pickup parent"}: {destinationLabel || "Address not available"}
          </p>
        ) : (
          <p>Accept a trip to view pickup route details.</p>
        )}
      </div>
    </div>
  );
}

async function jsonFetch(url: string, init?: RequestInit) {
  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.message || "Request failed");
  }
  return data;
}

export function StandaloneDriverDashboard({ driver, requestsData }: Props) {
  const [requests, setRequests] = useState(requestsData);
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
  const [isPending, startTransition] = useTransition();

  const verified = verificationStatus === "VERIFIED";
  const verificationLocked = verified;
  const vehicleName = [driver.carColor, driver.carMake, driver.carModel].filter(Boolean).join(" ");
  const pendingTripRequests = requests.filter((request) => request.status === "PENDING");
  const recentTrips = requests.filter((request) => request.status !== "PENDING").slice(0, 8);
  const activeTrip = requests.find(
    (request) => request.status === "ACCEPTED" && !request.droppedOffAt
  ) || null;
  const occupiedSeats = requests.filter(
    (request) => request.status === "ACCEPTED" && !request.droppedOffAt
  ).length;
  const availableSeats = driver.vehicleCapacity
    ? Math.max(driver.vehicleCapacity - occupiedSeats, 0)
    : null;

  const captureLocation = () => {
    if (!navigator.geolocation) {
      toast({ description: "GPS is not available in this browser.", variant: "destructive" });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setVerification((current) => ({
          ...current,
          liveAddress: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          },
        }));
        toast({ description: "Live GPS location captured." });
      },
      () => {
        toast({ description: "Unable to capture GPS location.", variant: "destructive" });
      },
      { enableHighAccuracy: true }
    );
  };

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

  const respondToRequest = (requestId: string, action: "accept" | "decline" | "picked_up" | "dropped_off") => {
    startTransition(async () => {
      try {
        const data = await jsonFetch(`/api/driver-requests/${requestId}`, {
          method: "PATCH",
          body: JSON.stringify({ action }),
        });

        if (["picked_up", "dropped_off"].includes(action)) {
          const refreshed = await jsonFetch("/api/driver-requests");
          setRequests(refreshed.requests || []);
        } else {
          setRequests((current) =>
            current.map((request) =>
              request.id === requestId ? { ...request, status: data.request.status } : request
            )
          );
        }
        toast({ description: data.message });
      } catch (error) {
        toast({
          description: error instanceof Error ? error.message : "Unable to update request",
          variant: "destructive",
        });
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
          <button
            type="button"
            onClick={() => setSettingsOpen(false)}
            className="rounded-md p-2 text-slate-500 hover:bg-slate-100"
            aria-label="Close settings"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="grid gap-5 p-4">
          <section className="rounded-lg border border-slate-200 bg-white p-4">
            <h2 className="mb-4 text-base font-semibold">Recent trips</h2>
            <div className="grid gap-3">
              {recentTrips.length ? (
                recentTrips.map((request) => (
                  <div key={request.id} className="flex flex-col gap-3 rounded-md border border-slate-200 p-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-semibold">
                          {request.parent.full_name || "Parent"} - {request.child.fullName}
                        </p>
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${request.droppedOffAt ? "bg-emerald-50 text-emerald-700" : statusStyles[request.status] || "bg-slate-100 text-slate-600"}`}>
                          {getTripStatusLabel(request)}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-slate-500">
                        {request.parent.phoneNumber || "No phone number"} - {request.parentPickupCount || 1} kid{(request.parentPickupCount || 1) === 1 ? "" : "s"}
                      </p>
                      <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                        <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                        {request.child.address || request.routeArea || "School address visible after pickup"}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {request.droppedOffAt
                          ? `Dropped off ${formatDateTime(request.droppedOffAt)}`
                          : request.pickedUpAt
                            ? `Picked up ${formatDateTime(request.pickedUpAt)}`
                            : formatDateTime(request.respondedAt) || formatDateTime(request.createdAt) || "Recent trip"}
                      </p>
                    </div>
                    {request.status === "ACCEPTED" && !request.pickedUpAt && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={isPending}
                        onClick={() => respondToRequest(request.id, "picked_up")}
                        className="gap-2"
                      >
                        <Check className="h-4 w-4" aria-hidden="true" />
                        Picked up
                      </Button>
                    )}
                    {request.status === "ACCEPTED" && request.pickedUpAt && !request.droppedOffAt && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={isPending}
                        onClick={() => respondToRequest(request.id, "dropped_off")}
                        className="gap-2"
                      >
                        <Check className="h-4 w-4" aria-hidden="true" />
                        Dropped off
                      </Button>
                    )}
                  </div>
                ))
              ) : (
                <p className="rounded-md bg-slate-50 p-3 text-sm text-slate-500">No recent trips yet.</p>
              )}
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
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    disabled={verificationLocked || !!uploadingField || isPending}
                    onChange={(event) => uploadVerificationFile(event, "image")}
                  />
                </label>
              </div>
              <Input
                className={inputClass}
                placeholder="Phone number"
                value={verification.phoneNumber}
                disabled={verificationLocked}
                onChange={(event) =>
                  setVerification((current) => ({ ...current, phoneNumber: event.target.value }))
                }
              />
              <Input
                className={inputClass}
                placeholder="Address"
                value={verification.address}
                disabled={verificationLocked}
                onChange={(event) =>
                  setVerification((current) => ({ ...current, address: event.target.value }))
                }
              />
              <Input
                className={inputClass}
                placeholder="Landmark"
                value={verification.landmark}
                disabled={verificationLocked}
                onChange={(event) =>
                  setVerification((current) => ({ ...current, landmark: event.target.value }))
                }
              />
              <div className="grid gap-2 rounded-md border border-slate-200 p-3">
                <p className="truncate text-xs text-slate-500">
                  {verification.utilityBillUrl || "No utility bill uploaded"}
                </p>
                <label className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-800 hover:bg-slate-50">
                  <Upload className="h-4 w-4" aria-hidden="true" />
                  {uploadingField === "utilityBillUrl" ? "Uploading..." : "Upload utility bill"}
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    disabled={verificationLocked || !!uploadingField || isPending}
                    onChange={(event) => uploadVerificationFile(event, "utilityBillUrl")}
                  />
                </label>
              </div>
              <div className="grid gap-2 rounded-md border border-slate-200 p-3">
                <p className="truncate text-xs text-slate-500">
                  {verification.identityDocumentUrl || "No passport page or NIN card uploaded"}
                </p>
                <label className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-800 hover:bg-slate-50">
                  <FileBadge className="h-4 w-4" aria-hidden="true" />
                  {uploadingField === "identityDocumentUrl" ? "Uploading..." : "Upload passport/NIN"}
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    disabled={verificationLocked || !!uploadingField || isPending}
                    onChange={(event) => uploadVerificationFile(event, "identityDocumentUrl")}
                  />
                </label>
              </div>
              <div className="flex flex-col gap-2 rounded-md border border-slate-200 p-3">
                <p className="text-xs text-slate-500">
                  {verification.liveAddress
                    ? `${verification.liveAddress.latitude}, ${verification.liveAddress.longitude}`
                    : "No GPS location captured"}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  disabled={verificationLocked}
                  onClick={captureLocation}
                  className="gap-2"
                >
                  <Crosshair className="h-4 w-4" aria-hidden="true" />
                  Capture GPS
                </Button>
              </div>
              {verificationLocked ? (
                <p className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-700">
                  Your account is verified. Verification details are locked.
                </p>
              ) : (
                <Button disabled={isPending} onClick={submitVerification}>
                  Submit for review
                </Button>
              )}
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-base font-semibold">Vehicle details</h2>
              {verified && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />
                  Verified
                </span>
              )}
            </div>
            <div className="grid gap-3">
              <div className="rounded-lg bg-slate-950 p-4 text-white">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-lg font-semibold">{vehicleName || "Vehicle not completed"}</p>
                    <p className="text-sm text-white/60">{driver.plateNumber || "No plate number"}</p>
                  </div>
                  <Car className="h-6 w-6 shrink-0 text-white/80" aria-hidden="true" />
                </div>
                <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-white/50">Capacity</p>
                    <p className="font-medium">
                      {driver.vehicleCapacity
                        ? `${availableSeats} of ${driver.vehicleCapacity} seats free`
                        : "Not set"}
                    </p>
                  </div>
                  <div>
                    <p className="text-white/50">Service areas</p>
                    <p className="truncate font-medium">
                      {driver.serviceAreas.length ? driver.serviceAreas.join(", ") : "Not set"}
                    </p>
                  </div>
                </div>
              </div>
              {verified ? (
                <div className="flex gap-3 rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
                  <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  <p>Car details cannot be edited after account verification. To change car details, contact customer care.</p>
                </div>
              ) : (
                <div className="flex gap-3 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                  <Clock3 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  <p>Car details are reviewed during verification. Make sure they are correct before approval.</p>
                </div>
              )}
            </div>
          </section>
        </div>
      </aside>

      <nav className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl items-center gap-4">
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            className="flex min-w-0 flex-1 items-center gap-4 text-left"
            aria-label="Open driver details"
          >
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
                {verified ? (
                  <BadgeCheck className="h-6 w-6 shrink-0 text-emerald-600" aria-label="Verified" />
                ) : (
                  <CircleSlash className="h-6 w-6 shrink-0 text-slate-400" aria-label="Not verified" />
                )}
              </span>
              <span className="block truncate text-xs font-semibold uppercase tracking-wide text-slate-500">
                {verificationStatus.replace("_", " ")}
              </span>
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

      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-6">

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="mb-4 text-base font-semibold">Trip requests</h2>
        <div className="grid gap-3">
          {pendingTripRequests.length ? (
            pendingTripRequests.map((request) => (
              <div key={request.id} className="flex flex-col gap-3 rounded-md border border-slate-200 p-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 gap-3">
                  <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-full bg-slate-100">
                    {request.parent.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={request.parent.image} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <UserRound className="h-6 w-6 text-slate-500" aria-hidden="true" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">
                      {request.parent.full_name || "Parent"} - {request.child.fullName}
                    </p>
                    <p className="text-xs text-slate-500">
                      {request.parentPickupCount || 1} kid{(request.parentPickupCount || 1) === 1 ? "" : "s"} to pick up
                    </p>
                    <p className="flex items-center gap-1 text-xs text-slate-500">
                      <Phone className="h-3.5 w-3.5" aria-hidden="true" />
                      {request.parent.phoneNumber || "No phone number"}
                    </p>
                    <p className="text-xs text-slate-500">{request.parent.address || "No parent address"}</p>
                  </div>
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-slate-500">
                    {request.child.address || request.routeArea || "School address visible after pickup"}
                  </p>
                  <p className="text-xs text-slate-500">
                    {formatDateTime(request.createdAt) || "New trip request"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    disabled={isPending}
                    onClick={() => respondToRequest(request.id, "accept")}
                    className="gap-2"
                  >
                    <Check className="h-4 w-4" aria-hidden="true" />
                    Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={isPending}
                    onClick={() => respondToRequest(request.id, "decline")}
                    className="gap-2"
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                    Decline
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <p className="rounded-md bg-slate-50 p-3 text-sm text-slate-500">No pending trip requests.</p>
          )}
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold">Route map</h2>
            <p className="text-sm text-slate-500">
              {activeTrip?.pickedUpAt
                ? "After pickup, the school address is visible."
                : activeTrip
                  ? "Before pickup, route details point to the parent address."
                  : "Accept a request to start route guidance."}
            </p>
          </div>
          <MapPin className="h-5 w-5 text-slate-500" aria-hidden="true" />
        </div>
        <DriverRouteMap driverLocation={verification.liveAddress} request={activeTrip} />
      </section>
      </div>
    </main>
  );
}
