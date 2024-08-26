"use server"
import { TeachersViewData } from '@/components/teachers-view/teachersdata'
import { db } from '@/lib/db'
import { getUserSession } from '@/lib/session'
import { revalidateTag } from 'next/cache'
import React from 'react'

const TeacherView = async () => {
    const user = await getUserSession()
    const teacherData = await db.teacher.findUnique({
        where: {
            id: user?.id
        },
        include: {
            Student: true,
            bus: {
                include: {
                    students: true,
                    driver: true,
                },
            },
        },

    })
    revalidateTag("collection")
    return (
        <div>
            <TeachersViewData userId={user?.id} user={user} data={teacherData} />
        </div>
    )
}



export default TeacherView


