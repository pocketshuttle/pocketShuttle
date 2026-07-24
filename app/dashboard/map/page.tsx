"use server"
import LoginButton from '@/components/auth/login-button'
import { NetworkError } from '@/components/errorsandsuccess/error/error'
import TeachersLocation, { DriversLocation } from '@/components/maps/Map/drivers-map'
import { Button } from '@/components/ui/button'
import { getUserSession } from '@/lib/session'
import Link from 'next/link'
import { getEntitlements, hasFeature } from '@/lib/billing/entitlements'


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
        const resolved = await getEntitlements({
            id: String(user.id),
            role: String(user.role),
            schoolId: typeof user.schoolId === "string" ? user.schoolId : String(user.id),
        });
        if (!hasFeature(resolved, "fleet_map")) {
            return (
                <div className="mx-auto max-w-xl rounded-xl border border-slate-200 bg-white p-6 text-center">
                    <h1 className="text-xl font-semibold">Fleet-wide live map</h1>
                    <p className="mt-2 text-sm text-slate-600">
                        The combined fleet map is included in School Pro. Basic active-trip
                        location remains available from each bus.
                    </p>
                    <Button asChild className="mt-5">
                        <Link href="/dashboard/billing">View School Pro</Link>
                    </Button>
                </div>
            );
        }
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
