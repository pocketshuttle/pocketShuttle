import { Teachers } from '@/components/Teachers/teachers'
import { db } from '@/lib/db'
import { getUserSession } from '@/lib/session'
import React from 'react'

const TeachersDrivers = async () => {

    return (
        <div>
            <Teachers />
        </div>
    )
}

export default TeachersDrivers