import ParentViewData from '@/components/parent-view/parentdata'
import { getUserSession } from '@/lib/session'
import React from 'react'

const TeacherView = async () => {
    const user = await getUserSession()

    return (
        <div>
            <ParentViewData userId={user?.id} user={user} />
        </div>
    )
}



export default TeacherView