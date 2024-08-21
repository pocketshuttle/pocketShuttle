import { TeachersViewData } from '@/components/teachers-view/teachersdata'
import { getUserSession } from '@/lib/session'
import React from 'react'

const TeacherView = async () => {
    const user = await getUserSession()

    return (
        <div>
            <TeachersViewData userId={user?.id} user={user} />
        </div>
    )
}



export default TeacherView


