import React from 'react'
import { CommuteTable } from './ui/commute-table'
import { getUserSession } from '@/lib/session'

const CommuteUI = async () => {
    const user = await getUserSession()
    const userId = user?.id
    return (
        <div>
            <CommuteTable userId={userId} />
        </div>
    )
}

export default CommuteUI