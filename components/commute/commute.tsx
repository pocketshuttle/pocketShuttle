import React from 'react'
import { CommuteTable } from './ui/commute-table'
import { getUserSession } from '@/lib/session'
import { db } from '@/lib/db'
import { revalidateTag } from 'next/cache'
import LoginButton from '../auth/login-button'
import { Button } from '../ui/button'

const CommuteUI = async () => {
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
    const userId = user?.id


    const bus = await db.buses.findMany({
        where: {
            OR: [{ id: userId }, { schoolId: userId }],
        },
        include: {
            route: true,
            teacher: true,
            students: true,
            driver: true,
        },
    });
    revalidateTag("bus");

    return (
        <div>
            <CommuteTable userId={userId} />
        </div>
    )
}

export default CommuteUI