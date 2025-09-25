"use server"
import LoginButton from '@/components/auth/login-button'
import TeachersLocation, { DriversLocation } from '@/components/maps/Map/drivers-map'
import { Button } from '@/components/ui/button'
import { getUserSession } from '@/lib/session'


const page = async () => {
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
    return (
        <div>
            < TeachersLocation userId={user?.id} />
        </div>
    )
}

export default page