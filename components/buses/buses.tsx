"use  server"
import { BusData } from "@/components/buses/ui/Table"
import { db } from "@/lib/db"
import { getUserSession } from "@/lib/session"
import { Button } from "../ui/button"
import LoginButton from "../auth/login-button"
import { revalidateTag } from "next/cache"

const Buses = async () => {
    const user = await getUserSession()

    if (!user) {
        return <div>
            User session is not available. Please log in.
            <LoginButton>
                <Button size={"lg"} >Login</Button>
            </LoginButton>

        </div>
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
        revalidateTag("bus");

        if (!bus) {
            // Handle the case where teacher data is not found
            return <div>No teacher data found for this user.</div>;
        }
        return (
            <div>
                <BusData data={bus} />
            </div>
        )
    } catch (error) {
        console.error("Error fetching teacher data:", error);
        return <div>An error occurred while fetching teacher data.</div>;
    }

    // revalidateTag("collection")

}

export default Buses 