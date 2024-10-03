// import Location from "@/components/maps/Map/Map"
import LoginButton from '@/components/auth/login-button'
import { DriversLocation } from '@/components/maps/Map/drivers-map'
import { Button } from '@/components/ui/button'
import { db } from '@/lib/db'
import { getUserSession } from '@/lib/session'

const page = async () => {
    const session = await getUserSession()
    // If no user session, redirect to login
    if (!session || typeof session.id !== 'string') {
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
    const userId = session?.id

    const teachers = await db.teacher.findMany({
        where: {
            id: userId
        }
    })

    return (
        <div>
            < DriversLocation />
        </div>
    )
}

export default page