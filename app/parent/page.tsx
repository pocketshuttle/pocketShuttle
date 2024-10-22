import LoginButton from '@/components/auth/login-button'
import Location from '@/components/maps/Map/new-map'
import { BusArrival } from '@/components/parent-view/bus-arrival'
import ParentViewData from '@/components/parent-view/parentdata'
import { Button } from '@/components/ui/button'
import { db } from '@/lib/db'
import { getUserSession } from '@/lib/session'
import { revalidateTag } from 'next/cache'
import { Montserrat } from 'next/font/google'
import React, { Suspense } from 'react'

// Load Montserrat font
const mont = Montserrat({ subsets: ["latin"], weight: "500" })

const TeacherView = async () => {
    const user = await getUserSession()

    // Redirect to login if no user session
    if (!user || typeof user.id !== 'string') {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-center">
                    <p>User session is not available. Please log in.</p>
                    <LoginButton>
                        <Button size="lg">Login</Button>
                    </LoginButton>
                </div>
            </div>
        )
    }

    const id = user?.id

    const parent = await db.parent.findUnique({
        where: {
            id: id
        },
        include: {
            Student: {
                include: {
                    bus: {
                        include: {
                            teacher: true,
                            driver: true,
                        },
                    },
                },
            },
        },
    });

    if (!parent) {
        // Handle case where no parent data is found
        return (
            <div className="text-center flex items-center justify-center h-screen">
                <p>No Parent data found for this user. Please refresh or contact the school admin.</p>
            </div>
        );
    }

    // Trigger revalidation for student cache tag
    revalidateTag("parent")
    revalidateTag("students")

    return (
        <Suspense>

            <div className={`${mont.className} p-3`}>

                <div>
                    <BusArrival parentAddress={parent?.address} parentId={id} />
                </div>

                <ParentViewData parentData={parent} />
            </div>
        </Suspense>

    )
}

export default TeacherView
