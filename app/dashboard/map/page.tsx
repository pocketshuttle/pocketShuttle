"use server"
import LoginButton from '@/components/auth/login-button'
import { NetworkError } from '@/components/errorsandsuccess/error/error'
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
    try {
        return (
            <div>
                < TeachersLocation userId={user?.id} />
            </div>
        )
    } catch (error: any) {
        if (error.message.includes("Can't reach database server at")) {
            return (
                <div className="flex items-center justify-center">
                    <NetworkError error="Connection" />
                </div>
            );
        }
        return (
            <div className="flex min-h-screen items-center justify-center text-[var(--text)]">
                <p>An error occurred. Please refresh or try again later.</p>
            </div>
        );
    }

}

export default page
