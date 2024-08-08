import { TeachersViewData } from '@/components/teachers-view/teachersdata'
import { getUserSession } from '@/lib/session'
import React from 'react'

const TeacherView = async () => {
    const user = await getUserSession()

    console.log(user)
    return (
        <div>
            <TeachersViewData id={user?.id} />
        </div>
    )
}



export default TeacherView


