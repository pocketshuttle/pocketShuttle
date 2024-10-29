"use server"
import LoginButton from '@/components/auth/login-button';
import { NetworkError } from '@/components/errorsandsuccess/error/error';
import { TeachersViewData } from '@/components/teachers-view/teachersdata';
import { Button } from '@/components/ui/button';
import { db } from '@/lib/db';
import { getUserSession } from '@/lib/session';
import { revalidateTag } from 'next/cache';
import React, { Suspense } from 'react';

const TeacherView = async () => {
    const user = await getUserSession();

    // If no user session, redirect to login
    if (!user || typeof user.id !== 'string') {
        return (
            <div className="flex items-center justify-center">
                <div>
                    User session is not available. Please log in.
                    <LoginButton>
                        <Button size={"lg"}>Login</Button>
                    </LoginButton>
                </div>
            </div>
        )
    }

    try {
        const teacherData = await db.teacher.findUnique({
            where: {
                id: user.id,
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
        });

        if (!teacherData) {
            // Handle the case where teacher data is not found
            return <div>No teacher data found for this user.</div>;
        }

        // Revalidate the cache with the "collection" tag
        revalidateTag("students");

        return (
            <Suspense>
                <div>
                    {/* @ts-ignore */}
                    <TeachersViewData userId={user.id} user={user} data={teacherData} />
                </div>
            </Suspense>

        );
    } catch (error: any) {
        if (error.message.includes("Can't reach database server at")) {
            return <div className=" flex items-center justify-center">
                <NetworkError error="Connection" />
            </div>
        } else {
            <div className="flex items-center justify-center ">
                please refresh
            </div>
        }
        return <div>An error occurred while fetching teacher data.</div>;
    }
};

export default TeacherView;
