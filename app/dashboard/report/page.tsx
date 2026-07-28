import { NetworkError } from '@/components/errorsandsuccess/error/error';
import { MainPickUpPage } from '@/components/pick-logs/main-page'
import { getUserSession } from '@/lib/session';
import db from '@/packages/db/client';
import { getEntitlements, historyCutoff } from '@/lib/billing/entitlements';

export const dynamic = "force-dynamic";

const ReportPage = async () => {
    const user = await getUserSession();
    const schoolId = String(user?.schoolId ?? user?.id ?? "");

    if (!schoolId) {
        return (
            <div className="flex min-h-[360px] items-center justify-center rounded-lg border border-black/10 bg-white p-6 text-center text-black dark:border-white/10 dark:bg-zinc-950 dark:text-white">
                User session is not available. Please log in again.
            </div>
        );
    }

    try {
        const resolved = await getEntitlements({
            id: String(user.id),
            role: String(user.role),
            schoolId: typeof user.schoolId === "string" ? user.schoolId : schoolId,
        });
        const cutoff = historyCutoff(resolved);
        const [teacherData, totals, trackingTrips] = await Promise.all([
            db.teacher.findMany({
                where: { schoolId },
                select: {
                    Student: {
                        select: {
                            parent: { select: { address: true } },
                        },
                    },
                    bus: {
                        include: {
                            students: {
                                include: { parent: { select: { address: true } } }
                            },
                            driver: true,
                        },
                    },
                    full_name: true,
                    id: true,
                    busId: true
                },
                orderBy: { full_name: "asc" },
            }),
            db.$transaction([
                db.pickup.count({
                    where: {
                        Student: { schoolId },
                        ...(cutoff ? { pickUpTime: { gte: cutoff } } : {}),
                    },
                }),
                db.teacher.count({ where: { schoolId } }),
                db.buses.count({ where: { schoolId } }),
            ]),
            db.trip.findMany({
                where: {
                    schoolId,
                    ...(cutoff ? { createdAt: { gte: cutoff } } : {}),
                },
                include: {
                    locations: {
                        orderBy: { timestamp: "desc" },
                        take: 1,
                    },
                    events: {
                        orderBy: { timestamp: "desc" },
                        take: 30,
                    },
                    participants: true,
                },
                orderBy: { createdAt: "desc" },
            }),
        ]);

        const staleLocationCutoff = Date.now() - 2 * 60 * 1000;
        const flattenedEvents = trackingTrips.flatMap((trip) => trip.events);
        const trackingSummary = {
            activeTrips: trackingTrips.filter((trip) => trip.status === "active").length,
            completedTrips: trackingTrips.filter((trip) => trip.status === "completed").length,
            boarded: flattenedEvents.filter((event) => event.eventType === "participant_boarded").length,
            dropped: flattenedEvents.filter((event) => event.eventType === "participant_dropped").length,
            emergencyEvents: flattenedEvents.filter((event) =>
                ["emergency_triggered", "unusual_stop", "route_deviation"].includes(event.eventType)
            ).length,
            staleLocations: trackingTrips.filter((trip) => {
                const latestLocation = trip.locations[0];
                return trip.status === "active" && latestLocation
                    ? latestLocation.timestamp.getTime() < staleLocationCutoff
                    : false;
            }).length,
            notificationAttempts: flattenedEvents.filter((event) => {
                const payload = event.payload;
                return Boolean(
                    payload &&
                    typeof payload === "object" &&
                    !Array.isArray(payload) &&
                    (payload as Record<string, unknown>).source === "notification_dispatch"
                );
            }).length,
        };

        return (
            <MainPickUpPage
                data={teacherData}
                summary={{
                    totalPickups: totals[0],
                    totalTeachers: totals[1],
                    totalBuses: totals[2],
                }}
                trackingSummary={trackingSummary}
            />
        )
    } catch (error: any) {
        if (error.message?.includes("Can't reach database server at")) {
            return (
                <div className="flex items-center justify-center">
                    <NetworkError error="Connection" />
                </div>
            );
        }
        return (
            <div className="flex min-h-[360px] items-center justify-center rounded-lg border border-black/10 bg-white p-6 text-center text-black dark:border-white/10 dark:bg-zinc-950 dark:text-white">
                <p>An error occurred while loading reports. Please refresh or try again later.</p>
            </div>
        );
    }

}

export default ReportPage
