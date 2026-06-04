"use client";

import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import {
    AlertTriangle,
    Bus,
    CheckCircle2,
    Gauge,
    MapPin,
    Pencil,
    Phone,
    Route,
    Trash2,
    UserRound,
    UsersRound,
} from "lucide-react";

import { handleDelete } from "@/actions/delete-student";
import {
    flagTripRouteDeviation,
    flagTripUnusualStop,
    resolveTripEmergency,
    triggerTripEmergency,
} from "@/actions/trip-safety";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { AddData } from "@/components/ui/add-data-button";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { useFetch } from "@/hooks/useFetch";
import { useSession } from "@/hooks/useSession";
import {
    deriveTripMovementState,
    getLatestTripEvent,
    getLatestTripLocation,
} from "@/lib/trip-state";

import { AddRoute } from "./add-route";
import { BusModal } from "./bus-modal";
import RoutesModal from "./routes-modal";

type StudentView = {
    id: string;
    full_name?: string | null;
    grade?: string | null;
    address?: string | null;
    status?: string | null;
    presence?: string | null;
};

type TripLocationView = {
    lat: number;
    lng: number;
    speed?: number | null;
    heading?: number | null;
    timestamp?: Date | string | null;
};

type TripEventView = {
    eventType: string;
    payload?: unknown;
    timestamp?: Date | string | null;
};

type TripView = {
    id: string;
    status: string;
    safetyState?: string | null;
    locations?: TripLocationView[];
    events?: TripEventView[];
};

type BusView = {
    id: string;
    bus_product_name: string;
    bus_number: string;
    color?: string | null;
    seat_number?: string | number | null;
    availableSeats?: string | number | null;
    students?: StudentView[];
    driver?: { full_name?: string | null; phoneNumber?: string | null } | null;
    teacher?: { full_name?: string | null; phoneNumber?: string | null } | null;
    route?: { route_name?: string | null } | null;
    activeTrip?: TripView | null;
};

function getSeatCount(bus: BusView) {
    const seats = Number(bus.seat_number);
    return Number.isFinite(seats) && seats > 0 ? seats : 0;
}

function getAvailableSeats(bus: BusView) {
    const seats = Number(bus.availableSeats);
    if (Number.isFinite(seats) && seats >= 0) {
        return seats;
    }

    return getSeatCount(bus);
}

function getRiders(bus: BusView) {
    return bus.students?.length ?? 0;
}

function getCapacityPercent(bus: BusView) {
    const seats = getSeatCount(bus);
    if (!seats) return 0;
    return Math.min(100, Math.round(((seats - getAvailableSeats(bus)) / seats) * 100));
}

function getMovementStatus(bus: BusView) {
    return deriveTripMovementState(bus.activeTrip);
}

function getLatestLocation(bus: BusView) {
    return getLatestTripLocation(bus.activeTrip);
}

function getLatestEvent(bus: BusView) {
    return getLatestTripEvent(bus.activeTrip);
}

function getPayloadValue(payload: unknown, key: string) {
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
        return null;
    }

    const value = (payload as Record<string, unknown>)[key];
    return typeof value === "string" ? value : null;
}

function getStudentFromEvent(bus: BusView, eventType: string) {
    const event = bus.activeTrip?.events?.find((item) => item.eventType === eventType);
    const studentId = getPayloadValue(event?.payload, "studentId");
    return bus.students?.find((student) => student.id === studentId) ?? null;
}

function getNextTargetStudent(bus: BusView) {
    const tripStartedEvent = bus.activeTrip?.events?.find(
        (event) => event.eventType === "trip_started"
    );
    const studentId = getPayloadValue(tripStartedEvent?.payload, "studentId");
    const eventStudent = bus.students?.find((student) => student.id === studentId);

    return (
        eventStudent ??
        bus.students?.find((student) => student.presence === "ON_THE_WAY") ??
        bus.students?.find((student) => student.status !== "DROPPED") ??
        null
    );
}

function formatLocation(location: TripLocationView | null) {
    if (!location) {
        return "Waiting for live vehicle location";
    }

    return `${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}`;
}

function formatTime(value?: Date | string | null) {
    if (!value) return "No recent update";

    return new Intl.DateTimeFormat("en", {
        hour: "2-digit",
        minute: "2-digit",
    }).format(new Date(value));
}

function getBusColor(bus: BusView) {
    return bus.color || "#f6c343";
}

function getRouteLabel(bus: BusView) {
    return bus.route?.route_name || "No route assigned";
}

function getCrewName(name?: string | null) {
    return name || "Unassigned";
}

export const BusData = ({ data }: { data: BusView[] }) => {
    const [isOpenModal, setIsOpenModal] = useState(false);
    const [isOpenRouteModal, setIsRouteOpenModal] = useState(false);
    const [isPending, startTransition] = useTransition();

    const session = useSession();
    const searchParams = useSearchParams();
    const selectedBusFromUrl = searchParams.get("busId");
    const userId = session?.id;
    const { data: routeData } = useFetch(`/api/addroute/${userId}`, userId);

    const busData = useMemo(
        () => (Array.isArray(data) ? data : []),
        [data]
    );
    const [selectedBusId, setSelectedBusId] = useState(selectedBusFromUrl ?? busData[0]?.id);
    const selectedBus = busData.find((bus) => bus.id === selectedBusId) ?? busData[0];

    useEffect(() => {
        if (selectedBusFromUrl && busData.some((bus) => bus.id === selectedBusFromUrl)) {
            setSelectedBusId(selectedBusFromUrl);
        }
    }, [busData, selectedBusFromUrl]);

    if (!selectedBus) {
        return (
            <section className="flex min-h-[360px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center dark:border-white/10 dark:bg-white/5">
                <div>
                    <Bus className="mx-auto h-10 w-10 text-slate-400" />
                    <h1 className="mt-4 text-xl font-semibold text-slate-950 dark:text-white">No vehicles yet</h1>
                    <p className="mt-2 max-w-md text-sm text-slate-500 dark:text-white/55">
                        Add a bus or vehicle to start tracking trips, participants, safety events, and route accountability.
                    </p>
                    <div className="mt-5">
                        <AddData label="Bus" action={() => setIsOpenModal(true)} />
                    </div>
                    {isOpenModal && (
                        <BusModal isOpenModal={isOpenModal} setIsOpenModal={setIsOpenModal} />
                    )}
                </div>
            </section>
        );
    }

    const activeTripId = selectedBus?.activeTrip?.id;
    const selectedStatus = getMovementStatus(selectedBus);
    const latestLocation = getLatestLocation(selectedBus);
    const latestEvent = getLatestEvent(selectedBus);
    const lastDroppedStudent = getStudentFromEvent(selectedBus, "participant_dropped");
    const nextTargetStudent = getNextTargetStudent(selectedBus);
    const capacityPercent = getCapacityPercent(selectedBus);
    const activeBuses = busData.filter((bus) => getMovementStatus(bus).label !== "Idle").length;
    const totalStudents = busData.reduce((total, bus) => total + getRiders(bus), 0);
    const totalSeats = busData.reduce((total, bus) => total + getSeatCount(bus), 0);
    const fleetCapacity = totalSeats ? Math.round((totalStudents / totalSeats) * 100) : 0;

    const runSafetyAction = (action: () => Promise<{ status: number; message: string }>) => {
        startTransition(() => {
            action()
                .then((result) => {
                    toast({ description: result.message });
                })
                .catch((error) => {
                    console.error("Safety action failed:", error);
                    toast({ description: "Safety action failed. Please try again." });
                });
        });
    };

    const handleDeleteBus = (id: string, mode: string) => {
        startTransition(() => {
            handleDelete(id, mode)
                .then((data) => {
                    toast({
                        description: data.message,
                    });
                })
                .catch((error) => {
                    console.error("Error:", error);
                    toast({
                        description: "An error occurred. Please try again.",
                    });
                });
        });
    };

    return (
        <section className="space-y-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">
                        Bus Fleet
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-white/55">
                        {busData.length} buses · {activeBuses} active · {totalStudents} assigned students
                    </p>
                </div>

                <div className="flex flex-wrap gap-2">
                    <AddData label="Bus" action={() => setIsOpenModal(true)} />
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={() => setIsRouteOpenModal(true)}
                        className="h-10 rounded-lg border border-slate-200 bg-white text-slate-800 shadow-none hover:bg-slate-50"
                    >
                        <Route className="mr-2 h-4 w-4" />
                        Routes
                    </Button>
                </div>
            </div>

            {isOpenModal && (
                <BusModal isOpenModal={isOpenModal} setIsOpenModal={setIsOpenModal} />
            )}
            {isOpenRouteModal && (
                <RoutesModal isOpenModal={isOpenRouteModal} setIsOpenModal={setIsRouteOpenModal} />
            )}

            <div className="grid gap-5 xl:grid-cols-[minmax(0,1.4fr)_360px]">
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-white/5">
                    <div className="relative min-h-[420px] bg-[linear-gradient(180deg,#f8fafc_0%,#eef2f7_100%)] p-5 dark:bg-none">
                        <div className="relative z-10 grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
                            <div className="space-y-3">
                                <div className="rounded-xl border border-white/80 bg-white/90 p-4 shadow-sm backdrop-blur">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <p className="text-xs font-medium uppercase text-slate-400">Vehicle</p>
                                            <h2 className="mt-1 text-2xl font-semibold text-slate-950">
                                                {selectedBus.bus_number}
                                            </h2>
                                        </div>
                                        <span className={`rounded-full border px-3 py-1 text-xs font-medium ${selectedStatus.tone}`}>
                                            {selectedStatus.label}
                                        </span>
                                    </div>

                                    <div className="mt-5 grid grid-cols-3 gap-3 text-sm">
                                        <div>
                                            <p className="text-slate-400">Capacity</p>
                                            <p className="font-semibold text-slate-950">{getSeatCount(selectedBus)}</p>
                                        </div>
                                        <div>
                                            <p className="text-slate-400">Available</p>
                                            <p className="font-semibold text-slate-950">{getAvailableSeats(selectedBus)}</p>
                                        </div>
                                        <div>
                                            <p className="text-slate-400">Occupied</p>
                                            <p className="font-semibold text-slate-950">{capacityPercent}%</p>
                                        </div>
                                    </div>

                                    <p className="mt-3 text-xs text-slate-500">
                                        {selectedStatus.reason}
                                    </p>

                                    <div className="mt-4 h-2 rounded-full bg-slate-100">
                                        <div
                                            className="h-full rounded-full bg-emerald-500"
                                            style={{ width: `${capacityPercent}%` }}
                                        />
                                    </div>
                                </div>

                                <div className="rounded-xl border border-white/80 bg-white/90 p-4 shadow-sm backdrop-blur">
                                    <p className="text-xs font-medium uppercase text-slate-400">Route</p>
                                    <div className="mt-3 flex gap-3">
                                        <div className="mt-1 flex flex-col items-center">
                                            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                                            <span className="h-8 w-px bg-slate-300" />
                                            <span className="h-2.5 w-2.5 rounded-full border-2 border-slate-950" />
                                            <span className="h-8 w-px bg-slate-300" />
                                            <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                                        </div>
                                        <div className="min-w-0 space-y-3 text-sm text-slate-700">
                                            <div className="min-w-0">
                                                <p className="truncate font-medium text-slate-950">Driver live location</p>
                                                <p className="truncate text-xs text-slate-500">
                                                    {formatLocation(latestLocation)} · {formatTime(latestLocation?.timestamp)}
                                                </p>
                                            </div>
                                            <div className="min-w-0">
                                                <p className="truncate font-medium text-slate-950">
                                                    {lastDroppedStudent ? "Last dropped student" : getRouteLabel(selectedBus)}
                                                </p>
                                                <p className="truncate text-xs text-slate-500">
                                                    {lastDroppedStudent?.address ?? selectedBus.bus_product_name}
                                                </p>
                                            </div>
                                            <div className="min-w-0">
                                                <p className="truncate font-medium text-slate-950">Next target</p>
                                                <p className="truncate text-xs text-slate-500">
                                                    {nextTargetStudent?.address ?? "Waiting for next trip event"}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-4 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
                                        Latest event: {latestEvent?.eventType?.replaceAll("_", " ") ?? "No trip events yet"}
                                    </div>
                                </div>

                                <div className="rounded-xl border border-white/80 bg-white/90 p-4 shadow-sm backdrop-blur">
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="flex min-w-0 items-center gap-3">
                                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-100">
                                                <UserRound className="h-5 w-5 text-slate-500" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-semibold capitalize text-slate-950">
                                                    {getCrewName(selectedBus.driver?.full_name)}
                                                </p>
                                                <p className="text-xs text-slate-500">Driver</p>
                                            </div>
                                        </div>

                                        {selectedBus.driver?.phoneNumber && (
                                            <a
                                                href={`tel:${selectedBus.driver.phoneNumber}`}
                                                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50"
                                                aria-label={`Call ${getCrewName(selectedBus.driver.full_name)}`}
                                            >
                                                <Phone className="h-4 w-4" />
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="relative flex min-h-[320px] items-center justify-center">
                                <div className="absolute inset-x-8 bottom-12 h-10 rounded-[100%] bg-slate-300/40 blur-xl" />
                                <Image
                                    src="/images/buus.png"
                                    width={860}
                                    height={772}
                                    alt={`${selectedBus.bus_number} school bus`}
                                    priority
                                    className="relative z-10 max-h-[350px] w-full max-w-[620px] object-contain"
                                />
                                <div className="absolute right-3 top-3 rounded-xl border border-white/80 bg-white/90 p-4 text-center shadow-sm backdrop-blur">
                                    <Gauge className="mx-auto h-5 w-5 text-slate-700" />
                                    <p className="mt-2 text-2xl font-semibold text-slate-950">{fleetCapacity}%</p>
                                    <p className="text-xs text-slate-400">fleet load</p>
                                </div>
                                <div className="absolute bottom-4 left-4 rounded-xl border border-white/80 bg-white/90 px-4 py-3 shadow-sm backdrop-blur">
                                    <div className="flex items-center gap-3">
                                        <span
                                            className="h-8 w-8 rounded-lg border border-slate-200"
                                            style={{ backgroundColor: getBusColor(selectedBus) }}
                                        />
                                        <div>
                                            <p className="text-sm font-semibold capitalize text-slate-950">
                                                {selectedBus.color || "Default"}
                                            </p>
                                            <p className="text-xs text-slate-400">registered color</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3 overflow-x-auto border-t border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-black/10">
                        {busData.map((bus) => {
                            const status = getMovementStatus(bus);
                            const isSelected = bus.id === selectedBus.id;

                            return (
                                <button
                                    key={bus.id}
                                    type="button"
                                    onClick={() => setSelectedBusId(bus.id)}
                                    className={`grid min-w-[220px] grid-cols-[1fr_88px] items-center gap-3 rounded-xl border bg-white p-3 text-left transition ${isSelected ? "border-slate-950 shadow-sm" : "border-slate-200 hover:border-slate-300"}`}
                                >
                                    <span className="min-w-0">
                                        <span className="block truncate text-sm font-semibold text-slate-950">{bus.bus_number}</span>
                                        <span className="block truncate text-xs text-slate-500">{bus.bus_product_name}</span>
                                        <span className={`mt-2 inline-flex rounded-full border px-2 py-0.5 text-[0.65rem] font-medium ${status.tone}`}>
                                            {status.label}
                                        </span>
                                    </span>
                                    <Image
                                        src="/images/buus.png"
                                        width={120}
                                        height={108}
                                        alt=""
                                        className="h-14 w-20 object-contain"
                                    />
                                </button>
                            );
                        })}
                    </div>
                </div>

                <aside className="max-h-[calc(100vh-9rem)] space-y-4 overflow-y-auto pr-1 xl:sticky xl:top-4">
                    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_18px_50px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-white/5">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <p className="text-xs font-medium uppercase text-slate-400">Selected bus</p>
                                <h3 className="mt-1 text-xl font-semibold text-slate-950 dark:text-white">
                                    {selectedBus.bus_product_name}
                                </h3>
                            </div>
                            <Bus className="h-6 w-6 text-amber-500" />
                        </div>

                        <div className="mt-5 grid grid-cols-2 gap-3">
                            <Metric icon={UsersRound} label="Students" value={String(getRiders(selectedBus))} />
                            <Metric icon={Gauge} label="Available seats" value={`${getAvailableSeats(selectedBus)}/${getSeatCount(selectedBus)}`} />
                            <Metric icon={MapPin} label="Route" value={selectedBus.route ? "Assigned" : "Missing"} />
                            <Metric icon={CheckCircle2} label="Safety" value={selectedStatus.priority === "normal" ? "Normal" : selectedStatus.label} />
                        </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_18px_50px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-white/5">
                        <h3 className="font-semibold text-slate-950 dark:text-white">Crew</h3>
                        <div className="mt-4 space-y-3">
                            <CrewRow role="Driver" name={getCrewName(selectedBus.driver?.full_name)} phone={selectedBus.driver?.phoneNumber} />
                            <CrewRow role="Teacher" name={getCrewName(selectedBus.teacher?.full_name)} phone={selectedBus.teacher?.phoneNumber} />
                        </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_18px_50px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-white/5">
                        <div className="flex items-center justify-between gap-3">
                            <h3 className="font-semibold text-slate-950 dark:text-white">Route</h3>
                            {!selectedBus.route && (
                                <AddRoute data={routeData} placeholder="Select Route" label="Add Route" busId={selectedBus.id} />
                            )}
                        </div>
                        <p className="mt-3 text-sm text-slate-500">{getRouteLabel(selectedBus)}</p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_18px_50px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-white/5">
                        <h3 className="font-semibold text-slate-950 dark:text-white">Safety</h3>
                        <p className="mt-2 text-sm text-slate-500">{selectedStatus.reason}</p>
                        <div className="mt-4 grid grid-cols-2 gap-2">
                            <Button
                                type="button"
                                variant="secondary"
                                disabled={!activeTripId || isPending}
                                onClick={() => activeTripId && runSafetyAction(() => triggerTripEmergency({ tripId: activeTripId }))}
                                className="h-10 rounded-lg border border-red-200 bg-red-50 text-red-700 shadow-none hover:bg-red-100"
                            >
                                Emergency
                            </Button>
                            <Button
                                type="button"
                                variant="secondary"
                                disabled={!activeTripId || isPending}
                                onClick={() => activeTripId && runSafetyAction(() => resolveTripEmergency({ tripId: activeTripId }))}
                                className="h-10 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 shadow-none hover:bg-emerald-100"
                            >
                                Resolve
                            </Button>
                            <Button
                                type="button"
                                variant="secondary"
                                disabled={!activeTripId || isPending}
                                onClick={() => activeTripId && runSafetyAction(() => flagTripUnusualStop({ tripId: activeTripId }))}
                                className="h-10 rounded-lg border border-slate-200 bg-white text-slate-800 shadow-none hover:bg-slate-50"
                            >
                                Stop
                            </Button>
                            <Button
                                type="button"
                                variant="secondary"
                                disabled={!activeTripId || isPending}
                                onClick={() => activeTripId && runSafetyAction(() => flagTripRouteDeviation({ tripId: activeTripId }))}
                                className="h-10 rounded-lg border border-slate-200 bg-white text-slate-800 shadow-none hover:bg-slate-50"
                            >
                                Deviation
                            </Button>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_18px_50px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-white/5">
                        <div className="flex items-center justify-between gap-3">
                            <h3 className="font-semibold text-slate-950 dark:text-white">Passengers</h3>
                            <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">
                                {getRiders(selectedBus)}
                            </span>
                        </div>
                        <div className="mt-4 max-h-48 space-y-2 overflow-y-auto">
                            {selectedBus.students?.length ? (
                                selectedBus.students.map((student) => (
                                    <div key={student.id} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2">
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-medium capitalize text-slate-950">{student.full_name}</p>
                                            <p className="truncate text-xs text-slate-500">{student.grade || student.presence || "Assigned"}</p>
                                        </div>
                                        <span className="rounded-full bg-white px-2 py-1 text-[0.65rem] font-medium text-slate-500">
                                            {student.status || "Ready"}
                                        </span>
                                    </div>
                                ))
                            ) : (
                                <div className="flex items-center gap-2 rounded-xl bg-amber-50 px-3 py-3 text-sm text-amber-800">
                                    <AlertTriangle className="h-4 w-4" />
                                    No students assigned
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <Button
                            type="button"
                            variant="secondary"
                            className="h-10 flex-1 rounded-lg border border-slate-200 bg-white text-slate-800 shadow-none hover:bg-slate-50"
                            asChild
                        >
                            <a href={`/dashboard/bus/${selectedBus.id}`}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                            </a>
                        </Button>

                        <AlertDeleteBus
                            bus={selectedBus}
                            disabled={isPending}
                            onDelete={() => handleDeleteBus(selectedBus.id, "bus")}
                        />
                    </div>
                </aside>
            </div>
        </section>
    );
};

function Metric({
    icon: Icon,
    label,
    value,
}: {
    icon: typeof Gauge;
    label: string;
    value: string;
}) {
    return (
        <div className="rounded-xl bg-slate-50 p-3">
            <Icon className="h-4 w-4 text-slate-500" />
            <p className="mt-2 text-lg font-semibold text-slate-950">{value}</p>
            <p className="text-xs text-slate-500">{label}</p>
        </div>
    );
}

function CrewRow({ role, name, phone }: { role: string; name: string; phone?: string | null }) {
    return (
        <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100">
                    <UserRound className="h-4 w-4 text-slate-500" />
                </div>
                <div className="min-w-0">
                    <p className="truncate text-sm font-medium capitalize text-slate-950">{name}</p>
                    <p className="text-xs text-slate-500">{role}</p>
                </div>
            </div>
            {phone && (
                <a
                    href={`tel:${phone}`}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50"
                    aria-label={`Call ${name}`}
                >
                    <Phone className="h-4 w-4" />
                </a>
            )}
        </div>
    );
}

function AlertDeleteBus({
    bus,
    disabled,
    onDelete,
}: {
    bus: BusView;
    disabled: boolean;
    onDelete: () => void;
}) {
    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button
                    type="button"
                    variant="destructive"
                    disabled={disabled}
                    className="h-10 rounded-lg"
                >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="border-none bg-gray-900 text-white">
                <AlertDialogHeader>
                    <AlertDialogTitle>Delete this bus?</AlertDialogTitle>
                    <AlertDialogDescription className="text-gray-400">
                        {`This will delete ${bus.bus_product_name} (${bus.bus_number}) and its bus record.`}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel className="bg-inherit">Cancel</AlertDialogCancel>
                    <AlertDialogAction className="bg-destructive" onClick={onDelete}>
                        Continue
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
