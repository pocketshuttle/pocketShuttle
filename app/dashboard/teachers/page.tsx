import LoginButton from '@/components/auth/login-button'
import { Teachers } from '@/components/Teachers/teachers'
import { TeachersTable } from '@/components/Teachers/ui/TeacherTable'
import { Button } from '@/components/ui/button'
import { getUserSession } from '@/lib/session'
import db from '@/packages/db/client'
import { revalidateTag } from 'next/cache'
import React from 'react'

const TeachersDrivers = async ({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) => {
    const user = await getUserSession()
    const resolvedSearchParams = await searchParams;

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

    const userId = user?.id
    const page = typeof resolvedSearchParams.page === "string" ? Number(resolvedSearchParams.page) : 1
    const searchQuery = typeof resolvedSearchParams.q === "string" ? resolvedSearchParams.q : ""
    const ITEM_PER_PAGE = 10;

    type TeacherWhere = NonNullable<Parameters<typeof db.teacher.findMany>[0]>['where']

    const queryClause: TeacherWhere = {
        OR: [
            {
                schoolId: userId,
            },
            {
                id: userId,
            },
        ],
        //we check the search query has a value, all searches are cases insensitive
        // you can search by full_name

        ...(searchQuery && {
            full_name: { contains: searchQuery, mode: "insensitive" }
        })
    }

    try {
        const teacherCount = await db.teacher.count({
            where: {
                id: userId
            }
        })

        const teacherData = await db.teacher.findMany({
            where: queryClause,
            include: {
                Student: true,
                bus: {
                    include: {
                        students: true,
                        driver: true,
                    },
                },
            },
            take: ITEM_PER_PAGE,
            skip: ITEM_PER_PAGE * (page - 1),
        });
        if (!teacherData) {
            // Handle the case where teacher data is not found
            return <div className='text-center'>No teacher data found for this user, try again or add a Teacher</div>;
        }

        const bus = await db.buses.findMany({
            where: {
                OR: [{ id: user?.id }, { schoolId: user?.id }],
            },
            include: {
                route: true,
                teacher: true,
                students: true,
                driver: true,
            },
        });

        if (!teacherData) {
            // Handle the case where parent data is not found
            return <div className='text-center flex items-center '>No Student found data found for this user, please refresh or contact school admin.</div>;
        }

        return (
            <div>
                <Teachers teacherCount={teacherCount} teacherData={teacherData} bus={bus} />
                {/* <TeachersTable /> */}
            </div>
        )

    } catch (error) {
        console.error("Error fetching Parents data:", error);
        return <div className='text-center'>An error occurred while fetching Teachers data, please refresh or try again later.</div>;
    }

}

export default TeachersDrivers