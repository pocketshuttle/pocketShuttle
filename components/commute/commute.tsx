import React from 'react'
import { CommuteTable } from './ui/commute-table'
import { getUserSession } from '@/lib/session'
import { db } from '@/lib/db'
import { revalidateTag } from 'next/cache'

const CommuteUI = async () => {
    const user = await getUserSession()
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

            {/* @ts-ignore */}
            <CommuteTable busData={bus} />
        </div>
    )
}

export default CommuteUI