"use server"
import LoginButton from '@/components/auth/login-button';
import { TeachersViewData } from '@/components/teachers-view/teachersdata';
import { Button } from '@/components/ui/button';
import { db } from '@/lib/db';
import { getUserSession } from '@/lib/session';
import { revalidateTag } from 'next/cache';
import React from 'react';

const TeacherView = async () => {
    const user = await getUserSession();

    if (!user) {
        // Handle the case where the user session is not available
        return <div>
            User session is not available. Please log in.
            <LoginButton>
                <Button size={"lg"} >Login</Button>
            </LoginButton>

        </div>
    }

    try {
        const teacherData = await db.teacher.findUnique({
            where: {
                id: user.id,  // Removed optional chaining since user is confirmed to exist
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
        revalidateTag("collection");

        return (
            <div>
                <TeachersViewData userId={user.id} user={user} data={teacherData} />
            </div>
        );
    } catch (error) {
        console.error("Error fetching teacher data:", error);
        return <div>An error occurred while fetching teacher data.</div>;
    }
};

export default TeacherView;
