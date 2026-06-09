"use client";

import { ChangeEvent, useEffect, useMemo, useState, useTransition } from "react";
import { motion, useMotionValue, useTransform } from "framer-motion";
import { APIProvider, AdvancedMarker, Map, Pin } from "@vis.gl/react-google-maps";
import { BadgeCheck, Car, CircleSlash, ImagePlus, MapPin, Send, Trash2, UserRound, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";

type Child = {
  id: string;
  fullName: string;
  age?: number | null;
  grade?: string | null;
  address?: string | null;
  image?: string | null;
  activeDriver?: Driver | null;
};

type Driver = {
  id: string;
  full_name: string;
  phoneNumber?: string | null;
  address?: string | null;
  liveAddress?: { latitude: number; longitude: number } | null;
  serviceAreas: string[];
  verificationStatus: string;
  carMake?: string | null;
  carModel?: string | null;
  carColor?: string | null;
  plateNumber?: string | null;
  vehicleCapacity?: number | null;
  usedSeats?: number;
  availableSeats?: number | null;
  isFull?: boolean;
};

type DriverRequest = {
  id: string;
  status: string;
  pickedUpAt?: string | Date | null;
  droppedOffAt?: string | Date | null;
  routeArea?: string | null;
  child: Child;
  driver: Driver;
};

type Props = {
  parentName?: string | null;
  childrenData: Child[];
  driversData: Driver[];
  requestsData: DriverRequest[];
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
  if (!response.ok) {
    throw new Error(data?.message || "Request failed");
  }
  return data;
}

function StandaloneDriversMap({
  drivers,
  selectedDriverId,
  onSelectDriver,
}: {
  drivers: Driver[];
  selectedDriverId: string | null;
  onSelectDriver: (driverId: string) => void;
}) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const driversWithGps = drivers.filter((driver) => driver.liveAddress);
  const center = driversWithGps[0]?.liveAddress
    ? {
        lat: driversWithGps[0].liveAddress.latitude,
        lng: driversWithGps[0].liveAddress.longitude,
      }
    : { lat: 6.5244, lng: 3.3792 };

  if (!apiKey) {
    return (
      <div className="grid h-full w-full place-items-center bg-slate-200 px-4 text-center text-sm text-slate-600">
        Map is unavailable right now.
      </div>
    );
  }

  return (
    <APIProvider apiKey={apiKey}>
      <Map
        defaultCenter={center}
        defaultZoom={driversWithGps.length ? 12 : 10}
        mapId={process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID}
        fullscreenControl={false}
        streetViewControl={false}
        mapTypeControl={false}
      >
        {driversWithGps.map((driver) => (
          <AdvancedMarker
            key={driver.id}
            position={{
              lat: driver.liveAddress!.latitude,
              lng: driver.liveAddress!.longitude,
            }}
            onClick={() => onSelectDriver(driver.id)}
            title={driver.full_name}
          >
            <Pin
              background={selectedDriverId === driver.id ? "#4f46e5" : "#111827"}
              borderColor="#ffffff"
              glyphColor="#ffffff"
            />
          </AdvancedMarker>
        ))}
      </Map>
      {!driversWithGps.length && (
        <div className="pointer-events-none absolute inset-x-3 top-4 max-w-[calc(100%-1.5rem)] rounded-lg bg-white/95 p-3 text-sm text-slate-600 shadow-sm sm:inset-x-4 sm:max-w-none">
          No nearby drivers have shared live GPS yet.
        </div>
      )}
    </APIProvider>
  );
}

export function StandaloneParentDashboard({
  parentName,
  childrenData,
  driversData,
  requestsData,
}: Props) {
  const [children, setChildren] = useState(childrenData);
  const [requests, setRequests] = useState(requestsData);
  const [selectedChildId, setSelectedChildId] = useState(requestsData[0]?.child.id || childrenData[0]?.id || "");
  const [selectedDriverId, setSelectedDriverId] = useState(requestsData[0]?.driver.id || driversData[0]?.id || "");
  const [routeFilter, setRouteFilter] = useState("");
  const [showAddKid, setShowAddKid] = useState(false);
  const [childForm, setChildForm] = useState({
    fullName: "",
    age: "",
    grade: "",
    address: "",
    image: "",
  });
  const [isUploadingChildImage, setIsUploadingChildImage] = useState(false);
  const [isPending, startTransition] = useTransition();

  const y = useMotionValue(0);
  const [expanded, setExpanded] = useState(true);
  const overlayOpacity = useTransform(y, [0, 300], [0.5, 0]);

  const filteredDrivers = useMemo(() => {
    const query = routeFilter.trim().toLowerCase();
    if (!query) return driversData;

    return driversData.filter((driver) =>
      driver.serviceAreas.some((area) => area.toLowerCase().includes(query))
    );
  }, [driversData, routeFilter]);

  const selectedChild = useMemo(
    () => children.find((child) => child.id === selectedChildId) || null,
    [children, selectedChildId]
  );

  const selectedDriver = useMemo(
    () => filteredDrivers.find((driver) => driver.id === selectedDriverId) || filteredDrivers[0] || null,
    [filteredDrivers, selectedDriverId]
  );

  const selectedRequest = useMemo(() => {
    if (!selectedChild || !selectedDriver) return null;
    return requests.find(
      (request) =>
        request.child.id === selectedChild.id &&
        request.driver.id === selectedDriver.id &&
        !request.droppedOffAt
    );
  }, [requests, selectedChild, selectedDriver]);

  const selectedChildRequest = useMemo(() => {
    if (!selectedChild) return null;
    return requests.find((request) =>
      request.child.id === selectedChild.id &&
      ["PENDING", "ACCEPTED"].includes(request.status) &&
      !request.droppedOffAt
    ) || null;
  }, [requests, selectedChild]);

  const selectedDriverVehicle = useMemo(() => {
    if (!selectedDriver) return "Vehicle details pending";
    return [selectedDriver.carColor, selectedDriver.carMake, selectedDriver.carModel]
      .filter(Boolean)
      .join(" ") || "Vehicle details pending";
  }, [selectedDriver]);

  useEffect(() => {
    const openAddKid = () => {
      setShowAddKid(true);
      setExpanded(true);
    };
    window.addEventListener("standalone-parent:add-kid", openAddKid);
    return () => window.removeEventListener("standalone-parent:add-kid", openAddKid);
  }, []);

  useEffect(() => {
    if (filteredDrivers.length && !filteredDrivers.some((driver) => driver.id === selectedDriverId)) {
      setSelectedDriverId(filteredDrivers[0].id);
    }
  }, [filteredDrivers, selectedDriverId]);

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
        setSelectedChildId(data.child.id);
        setChildForm({ fullName: "", age: "", grade: "", address: "", image: "" });
        setShowAddKid(false);
        toast({ description: data.message });
      } catch (error) {
        toast({
          description: error instanceof Error ? error.message : "Unable to add child",
          variant: "destructive",
        });
      }
    });
  };

  const uploadChildImage = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploadingChildImage(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.message || "Unable to upload image");
      }

      setChildForm((form) => ({ ...form, image: data.url }));
      toast({ description: "Kid image uploaded." });
    } catch (error) {
      toast({
        description: error instanceof Error ? error.message : "Unable to upload image",
        variant: "destructive",
      });
    } finally {
      setIsUploadingChildImage(false);
    }
  };

  const deleteChild = (childId: string) => {
    startTransition(async () => {
      try {
        const data = await jsonFetch(`/api/parent/children/${childId}`, {
          method: "DELETE",
        });
        setChildren((current) => current.filter((child) => child.id !== childId));
        if (selectedChildId === childId) {
          setSelectedChildId("");
        }
        toast({ description: data.message });
      } catch (error) {
        toast({
          description: error instanceof Error ? error.message : "Unable to remove child",
          variant: "destructive",
        });
      }
    });
  };

  const requestDriver = () => {
    if (!selectedChild || !selectedDriver) {
      toast({ description: "Select a child and driver first.", variant: "destructive" });
      return;
    }

    startTransition(async () => {
      try {
        const data = await jsonFetch("/api/driver-requests", {
          method: "POST",
          body: JSON.stringify({
            childId: selectedChild.id,
            driverId: selectedDriver.id,
            routeArea: routeFilter || selectedDriver.serviceAreas[0],
          }),
        });
        setRequests((current) => [data.request, ...current]);
        toast({ description: data.message });
      } catch (error) {
        toast({
          description: error instanceof Error ? error.message : "Unable to request driver",
          variant: "destructive",
        });
      }
    });
  };

  const cancelRequest = (requestId: string) => {
    startTransition(async () => {
      try {
        const data = await jsonFetch(`/api/driver-requests/${requestId}`, {
          method: "PATCH",
          body: JSON.stringify({ action: "cancel" }),
        });
        setRequests((current) =>
          current.map((request) =>
            request.id === requestId ? { ...request, status: data.request.status } : request
          )
        );
        toast({ description: data.message });
      } catch (error) {
        toast({
          description: error instanceof Error ? error.message : "Unable to cancel request",
          variant: "destructive",
        });
      }
    });
  };

  const requestLabel = selectedRequest?.status === "PENDING"
    ? "Requested"
    : selectedRequest?.status === "ACCEPTED"
      ? "Assigned"
      : "Request";

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-gray-100 text-black">
      <div className="relative h-[calc(100svh-72px)] min-h-[420px] w-full max-w-full touch-pan-y overflow-hidden bg-gray-100">
        <div className="absolute inset-0">
          <StandaloneDriversMap
            drivers={filteredDrivers}
            selectedDriverId={selectedDriver?.id || null}
            onSelectDriver={(driverId) => {
              setSelectedDriverId(driverId);
              setExpanded(true);
            }}
          />
        </div>

        {selectedDriver && (
          <div className="absolute inset-x-3 bottom-[24svh] z-10 mx-auto max-w-[calc(100%-1.5rem)] rounded-lg border border-black/10 bg-white p-3 text-black shadow-lg sm:inset-x-4 sm:bottom-[25svh] sm:max-w-lg">
            <div className="flex items-center gap-3">
              <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-black text-white">
                <Car className="h-7 w-7" aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="truncate text-base font-semibold capitalize">{selectedDriver.full_name}</h2>
                  {selectedDriver.verificationStatus === "VERIFIED" ? (
                    <BadgeCheck className="h-5 w-5 shrink-0 text-emerald-600" aria-label="Verified" />
                  ) : (
                    <CircleSlash className="h-5 w-5 shrink-0 text-slate-400" aria-label="Not verified" />
                  )}
                </div>
                <p className="truncate text-sm text-black/55">{selectedDriverVehicle}</p>
              </div>
              <Button
                size="sm"
                disabled={
                  isPending ||
                  selectedDriver.verificationStatus !== "VERIFIED" ||
                  !!selectedDriver.isFull ||
                  !selectedChild ||
                  ["PENDING", "ACCEPTED"].includes(selectedRequest?.status || "")
                }
                onClick={requestDriver}
                className="shrink-0 gap-2"
              >
                <Send className="h-4 w-4" aria-hidden="true" />
                {requestLabel}
              </Button>
            </div>
          </div>
        )}

        {expanded && (
          <motion.div
            className="absolute inset-0 bg-black/20"
            style={{ opacity: overlayOpacity }}
            onClick={() => setExpanded(false)}
          />
        )}

        <motion.div
          drag="y"
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={0.2}
          onDragEnd={(_, info) => {
            if (info.offset.y > 100) {
              setExpanded(false);
            } else {
              setExpanded(true);
            }
          }}
          initial={{ y: 0 }}
          animate={{
            height: expanded ? "72svh" : "22svh",
            y: 0,
          }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="absolute bottom-0 left-0 right-0 z-20 max-w-full overflow-x-hidden overflow-y-auto rounded-t-3xl border border-black/10 bg-white text-black"
        >
          <div className="sticky top-0 z-10 flex w-full justify-center bg-white/95 p-3 backdrop-blur">
            <div className="h-1.5 w-12 rounded-full bg-black/20" />
          </div>

          <div className="mx-auto grid w-full max-w-2xl gap-4 overflow-x-hidden px-3 pb-8 sm:px-4">
            <section className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-xl font-semibold text-black">Drivers</h2>
                <span className="rounded-full bg-black/5 px-3 py-1 text-xs text-black/55">
                  {filteredDrivers.length}
                </span>
              </div>
              <Input
                className={inputClass}
                placeholder="Filter service area"
                value={routeFilter}
                onChange={(event) => setRouteFilter(event.target.value)}
              />
              {filteredDrivers.length ? (
                <div className="flex w-full max-w-full gap-3 overflow-x-auto pb-1">
                  {filteredDrivers.map((driver) => {
                    const vehicle = [driver.carColor, driver.carMake, driver.carModel].filter(Boolean).join(" ") || "Vehicle pending";
                    const isSelected = selectedDriver?.id === driver.id;
                    return (
                      <button
                        key={driver.id}
                        type="button"
                        onClick={() => setSelectedDriverId(driver.id)}
                        className={`w-[min(260px,78vw)] shrink-0 rounded-lg border bg-white p-3 text-left transition ${
                          isSelected ? "border-black/40 shadow-sm" : "border-black/10"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-black text-white">
                            <Car className="h-6 w-6" aria-hidden="true" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <h3 className="truncate text-sm font-semibold capitalize text-black">{driver.full_name}</h3>
                              {driver.verificationStatus === "VERIFIED" ? (
                                <BadgeCheck className="h-4 w-4 shrink-0 text-emerald-600" aria-label="Verified" />
                              ) : (
                                <CircleSlash className="h-4 w-4 shrink-0 text-black/35" aria-label="Not verified" />
                              )}
                            </div>
                            <p className="truncate text-xs text-black/55">{vehicle}</p>
                          </div>
                        </div>
                    <p className="mt-3 truncate text-xs text-black/50">
                      {driver.serviceAreas.length ? driver.serviceAreas.join(", ") : "No service area"}
                    </p>
                    <p className="mt-2 text-xs font-medium text-black/60">
                      {driver.vehicleCapacity
                        ? driver.isFull
                          ? "Full"
                          : `${driver.availableSeats ?? driver.vehicleCapacity} seats available`
                        : "Capacity pending"}
                    </p>
                  </button>
                );
              })}
                </div>
              ) : (
                <div className="rounded-lg border border-black/10 bg-white p-5 text-center text-sm text-black/55">
                  No standalone drivers found.
                </div>
              )}
            </section>

            {selectedDriver ? (
              <section className="space-y-3 rounded-lg border border-sky-100 bg-sky-50/80 px-3 py-4 text-black">
                <header className="border-b-2 border-sky-400 pb-3 text-lg font-semibold text-black">
                  {selectedChildRequest?.status === "ACCEPTED"
                    ? `${selectedChild?.fullName || "Kid"} is assigned to ${selectedChildRequest.driver.full_name}`
                    : selectedChildRequest?.status === "PENDING"
                      ? `Waiting for ${selectedChildRequest.driver.full_name} to respond`
                      : "Recent driver"}
                </header>
                <div className="flex items-center justify-between gap-3 py-2">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="grid h-[54px] w-[54px] shrink-0 place-items-center rounded-full bg-black/10">
                      <UserRound className="h-7 w-7 text-black/70" aria-hidden="true" />
                    </div>
                    <div className="min-w-0">
                      <h2 className="truncate text-lg font-semibold capitalize text-black">{selectedDriver.full_name}</h2>
                      <small className="text-sm text-black/55">
                        {selectedDriver.verificationStatus === "VERIFIED" ? "Verified driver" : "Verification pending"}
                      </small>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    disabled={
                      isPending ||
                      selectedDriver.verificationStatus !== "VERIFIED" ||
                      !!selectedDriver.isFull ||
                      !selectedChild ||
                      ["PENDING", "ACCEPTED"].includes(selectedRequest?.status || "")
                    }
                    onClick={requestDriver}
                    className="shrink-0 gap-2"
                  >
                    <Send className="h-4 w-4" aria-hidden="true" />
                    {requestLabel}
                  </Button>
                </div>

                {selectedDriver.isFull && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                    This driver's vehicle is full right now.
                  </div>
                )}

                <div className="flex items-center justify-between rounded-lg border border-black/10 bg-white px-3 py-4">
                  <div className="min-w-0">
                    <h1 className="truncate text-xl font-semibold uppercase text-black">
                      {selectedDriver.plateNumber || "N/A"}
                    </h1>
                    <small className="block truncate text-sm capitalize text-black/55">
                      {selectedDriverVehicle}
                    </small>
                    <small className="mt-1 flex items-center gap-1 text-xs text-black/50">
                      <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                      {selectedDriver.serviceAreas.length ? selectedDriver.serviceAreas.join(", ") : "No service area"}
                    </small>
                  </div>
                  <Car className="h-16 w-16 shrink-0 text-black" aria-hidden="true" />
                </div>

                {selectedRequest && ["PENDING", "ACCEPTED"].includes(selectedRequest.status) && (
                  <div className="flex items-center justify-between gap-3 rounded-lg border border-black/10 bg-white p-3">
                    <div>
                      <p className="text-sm font-semibold">Request status</p>
                      <p className="text-xs uppercase text-black/55">{selectedRequest.status}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isPending}
                      onClick={() => cancelRequest(selectedRequest.id)}
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </section>
            ) : null}

            {showAddKid && (
              <div className="rounded-lg border border-black/10 bg-white p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="font-semibold">Add kid</h2>
                  {!!children.length && (
                    <button
                      type="button"
                      onClick={() => setShowAddKid(false)}
                      className="rounded-md p-1 text-slate-500 hover:bg-slate-200"
                      aria-label="Close add kid"
                    >
                      <X className="h-4 w-4" aria-hidden="true" />
                    </button>
                  )}
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="grid gap-2 sm:col-span-2">
                    <div className="flex items-center gap-3 rounded-lg border border-black/10 bg-white p-3">
                      <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-lg bg-black/5 ring-1 ring-black/10">
                        {childForm.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={childForm.image} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <UserRound className="h-8 w-8 text-black/45" aria-hidden="true" />
                        )}
                      </div>
                      <label className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-md border border-black/10 bg-white px-3 text-sm font-medium text-black hover:bg-black/[0.02]">
                        <ImagePlus className="h-4 w-4" aria-hidden="true" />
                        {isUploadingChildImage ? "Uploading..." : "Upload image"}
                        <input
                          type="file"
                          accept="image/*"
                          className="sr-only"
                          disabled={isUploadingChildImage || isPending}
                          onChange={uploadChildImage}
                        />
                      </label>
                    </div>
                  </div>
                  <Input
                    className={inputClass}
                    placeholder="Child name"
                    value={childForm.fullName}
                    onChange={(event) => setChildForm((form) => ({ ...form, fullName: event.target.value }))}
                  />
                  <Input
                    className={inputClass}
                    placeholder="Age"
                    type="number"
                    value={childForm.age}
                    onChange={(event) => setChildForm((form) => ({ ...form, age: event.target.value }))}
                  />
                  <Input
                    className={inputClass}
                    placeholder="Grade"
                    value={childForm.grade}
                    onChange={(event) => setChildForm((form) => ({ ...form, grade: event.target.value }))}
                  />
                  <Input
                    className={inputClass}
                    placeholder="School address"
                    value={childForm.address}
                    onChange={(event) => setChildForm((form) => ({ ...form, address: event.target.value }))}
                  />
                </div>
                <Button disabled={isPending || isUploadingChildImage || !childForm.fullName.trim()} onClick={addChild} className="mt-3">
                  Add kid
                </Button>
              </div>
            )}

            <h3 className="px-2 pb-1 pt-2 text-center text-xl font-semibold text-black">Kids</h3>
            <section className="space-y-3">
              {children.map((child) => (
                <div
                  key={child.id}
                  className={`mx-auto mb-4 flex w-full max-w-lg items-center gap-3 rounded-lg border bg-white p-3 text-black transition-all sm:gap-4 sm:p-4 ${
                    selectedChildId === child.id ? "border-black/30" : "border-black/10"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setSelectedChildId(child.id)}
                    className="flex min-w-0 flex-1 items-center gap-3 text-left sm:gap-4"
                  >
                    <div className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-lg bg-black/5 ring-1 ring-black/10">
                      {child.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={child.image} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <UserRound className="h-9 w-9 text-black/55" aria-hidden="true" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <h2 className="truncate text-base font-semibold capitalize leading-tight text-black">
                          {child.fullName || "Unnamed kid"}
                        </h2>
                        <span className="shrink-0 rounded-full bg-black/5 px-2 py-1 text-[11px] uppercase text-black/55">
                          {child.grade || "No grade"}
                        </span>
                      </div>
                      <p className="truncate text-sm capitalize text-black/55">
                        {child.address || "No school address"}
                      </p>
                      <div className="mt-2 flex justify-between gap-3 text-sm text-black/70">
                        <span className="min-w-0 truncate capitalize">
                          {child.activeDriver?.full_name || "No active driver"}
                        </span>
                        <span className="shrink-0 font-medium text-black">
                          {child.age ? `${child.age} yrs` : "Age N/A"}
                        </span>
                      </div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteChild(child.id)}
                    className="rounded-md p-2 text-black/45 hover:bg-black/5 hover:text-red-600"
                    aria-label="Remove child"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              ))}
              {!children.length && (
                <div className="mx-auto max-w-lg rounded-lg border border-black/10 bg-white p-5 text-center text-sm text-black/55">
                  No kids linked to this parent yet.
                </div>
              )}
            </section>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
