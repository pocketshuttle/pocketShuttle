"use  server"
import { BusData } from "@/components/buses/ui/Table"
import db from "@/packages/db/client"
import { getUserSession } from "@/lib/session"
import { Button } from "../ui/button"
import LoginButton from "../auth/login-button"
import { revalidateTag } from "next/cache"

const Buses = async () => {
    const user = await getUserSession()

    // If no user session, redirect to login
    if (!user || typeof user.id !== 'string') {
        return (
            <div className="flex items-center justify-center">
                <div>
                    User session is not available. Please log in.
                    <LoginButton>
                        <Button size={"lg"}>Login</Button>
                    </LoginButton>
                </div>
            </div>
        )
    }

    try {
        const bus = await db.buses.findMany({
            where: {
                OR: [{ id: user?.id }, { schoolId: user?.id }],
            },
            include: {
                route: true,
                teacher: true,
                students: true,
                driver: true,
            },
        });

        const busIds = bus.map((item) => item.id)
        const trips = busIds.length
            ? await db.trip.findMany({
                where: {
                    vehicleId: { in: busIds },
                    status: { in: ["scheduled", "active", "paused"] },
                },
                orderBy: { createdAt: "desc" },
                include: {
                    locations: {
                        orderBy: { timestamp: "desc" },
                        take: 1,
                    },
                    events: {
                        orderBy: { timestamp: "desc" },
                        take: 8,
                    },
                    participants: true,
                    viewers: true,
                },
            })
            : []

        const latestTripByVehicle = new Map<string, (typeof trips)[number]>()
        for (const trip of trips) {
            if (trip.vehicleId && !latestTripByVehicle.has(trip.vehicleId)) {
                latestTripByVehicle.set(trip.vehicleId, trip)
            }
        }

        const busWithTrips = bus.map((item) => ({
            ...item,
            activeTrip: latestTripByVehicle.get(item.id) ?? null,
        }))

        if (!bus) {
            // Handle the case where teacher data is not found
            return <div className="text-center">No Buses data found for this user.</div>;
        }
        revalidateTag("bus");
        return (
            <div>
                <BusData data={busWithTrips} />
            </div>
        )
    } catch (error) {
        console.error("Error fetching Buses data:", error);
        return <div className="text-center">An error occurred while fetching Buses data, please refresh or try again later</div>;
    }
}

export default Buses 
