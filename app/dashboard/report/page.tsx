"use server"
import LoginButton from '@/components/auth/login-button';
import { MainPickUpPage } from '@/components/pick-logs/main-page'
import { Button } from '@/components/ui/button';
import { db } from '@/dropoff-backend/lib/db';
import { getUserSession } from '@/lib/session';
import React from 'react'

const ReportPage = async () => {
    const user = await getUserSession();

    if (!user || typeof user.id !== 'string') {
        return (
            <div className="flex items-center justify-center">
                <div>
                    User session is not available. Please log in.
                    <LoginButton>
                        <Button size="lg">Login</Button>
                    </LoginButton>
                </div>
            </div>
        );
    }

    const teacherData = await db.teacher.findMany({
        where: { schoolId: user.id },
        select: {
            Student: {
                select: {
                    parent: { select: { address: true } },
                },
            },
            bus: {
                include: {
                    students: {
                        include: { parent: { select: { address: true } } }
                    },
                    driver: true,
                },
            },
            full_name: true,
            id: true,
            busId: true
        },
    });


    if (!teacherData) {
        return <div>No report generated yet for this user.</div>;
    }

    return (
        <div>
            <MainPickUpPage data={teacherData} />
        </div>
    )
}

export default ReportPage