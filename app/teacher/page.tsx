"use server";

import LoginButton from '@/components/auth/login-button';
import { NetworkError } from '@/components/errorsandsuccess/error/error';
import { TeachersViewData } from '@/components/teachers-view/teachersdata';
import { Button } from '@/components/ui/button';
// import { db } from '@/dropoff-backend/lib/db';
import { getUserSession } from '@/lib/session';
import db from '@/packages/db/client';
import { revalidateTag } from 'next/cache';
import React from 'react';

const TeacherView = async () => {
    const user = await getUserSession();

    if (!user?.id || typeof user.id !== "string") {
        return (
            <div className="flex items-center justify-center min-h-screen text-center">
                <div>
                    <p className="mb-4 text-black/70 dark:text-white/70">User session is not available. Please log in.</p>
                    <LoginButton>
                        <Button size="lg">Login</Button>
                    </LoginButton>
                </div>
            </div>
        );
    }

    try {
        const teacherData = await db.teacher.findUnique({
            where: { id: user.id },
            select: {
                Student: {
                    include: {
                        parent: {
                            select: { address: true },
                        },
                    },
                },
                bus: {
                    include: {
                        students: {
                            include: {
                                parent: {
                                    select: { address: true },
                                },
                            }
                        },
                        driver: true,
                    },
                },
            },
        });
        revalidateTag("teacher");


        if (!teacherData) {
            return (
                <div className="flex items-center justify-center min-h-screen">
                    <p className="text-black/60 dark:text-white/60">No teacher data found for this user.</p>
                </div>
            );
        }

        return (
            <div className="min-h-screen ">
                <TeachersViewData userId={user.id} user={user} data={teacherData} />
            </div>
        );
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
};

export default TeacherView;
