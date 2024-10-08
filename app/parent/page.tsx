import LoginButton from '@/components/auth/login-button'
import Location from '@/components/maps/Map/new-map'
import { BusArrival } from '@/components/parent-view/bus-arrival'
import ParentViewData from '@/components/parent-view/parentdata'
import { Button } from '@/components/ui/button'
import { db } from '@/lib/db'
import { getUserSession } from '@/lib/session'
import { Prisma } from '@prisma/client'
import { Weight } from 'lucide-react'
import { Montserrat } from 'next/font/google'
import React from 'react'

const mont = Montserrat({ subsets: ["latin"], weight: "500" })
const TeacherView = async () => {
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
    const id = user?.id
    const whereClause: Prisma.ParentWhereInput = {
        OR: [{ schoolId: id }, { id: id }],
    };

    const parentCount = await db.parent.count({
        where: whereClause,
    });

    const parent = await db.parent.findMany({
        where: whereClause,
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
        // Handle the case where parent data is not found
        return <div className='text-center flex items-center '>No Parent found data found for this user, please refresh or contact school admin.</div>;
    }

    return (
        <div className={mont.className}>
            <div >
                <  BusArrival parentAddress={parent[0]?.address} parentId={id} />
            </div>
            <ParentViewData parentData={parent} />
        </div>
    )
}



export default TeacherView