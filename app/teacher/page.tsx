"use server";

import LoginButton from '@/components/auth/login-button';
import { NetworkError } from '@/components/errorsandsuccess/error/error';
import { TeachersViewData } from '@/components/teachers-view/teachersdata';
import { Button } from '@/components/ui/button';
import { db } from '@/lib/db';
import { getUserSession } from '@/lib/session';
import React from 'react';

const TeacherView = async () => {
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
        const teacherData = await db.teacher.findUnique({
            where: { id: user.id },
            select: {
                Student: {
                    select: {
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

        if (!teacherData) {
            return <div>No teacher data found for this user.</div>;
        }

        return (
            <div>
                {/* @ts-ignore */}
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
            <div className="flex items-center justify-center">
                An error occurred. Please refresh.
            </div>
        );
    }
};

export default TeacherView;
