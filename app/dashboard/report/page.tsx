"use server"
import LoginButton from '@/components/auth/login-button';
import { NetworkError } from '@/components/errorsandsuccess/error/error';
import { MainPickUpPage } from '@/components/pick-logs/main-page'
import { Button } from '@/components/ui/button';
import { getUserSession } from '@/lib/session';
import db from '@/packages/db/client';
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

    try {
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
    } catch (error: any) {
        if (error.message.includes("Can't reach database server at")) {
            return (
                <div className="flex items-center justify-center">
                    <NetworkError error="Connection" />
                </div>
            );
        }
        return (
            <div className="flex items-center justify-center min-h-screen text-red-600">
                <p>An error occurred. Please refresh or try again later.</p>
            </div>
        );
    }

}

export default ReportPage