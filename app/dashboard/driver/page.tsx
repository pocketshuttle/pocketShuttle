import { DriverTable } from '@/components/driver/ui/Table'
import { Teachers } from '@/components/Teachers/teachers'
import { TeachersTable } from '@/components/Teachers/ui/TeacherTable'
import { db } from '@/lib/db'
import { getUserSession } from '@/lib/session'
import React from 'react'

const TeachersDrivers = async () => {

    return (
        <div>
            <Teachers />
            <DriverTable />
        </div>
    )
}

export default TeachersDrivers