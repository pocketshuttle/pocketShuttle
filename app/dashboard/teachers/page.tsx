import LoginButton from '@/components/auth/login-button'
import { Teachers } from '@/components/Teachers/teachers'
import { TeachersTable } from '@/components/Teachers/ui/TeacherTable'
import { Button } from '@/components/ui/button'
import { db } from '@/lib/db'
import { getUserSession } from '@/lib/session'
import { revalidateTag } from 'next/cache'
import React from 'react'

const TeachersDrivers = async ({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) => {
    const user = await getUserSession()
    // if no user, that means you havent logged in, so redirect back to login page
    if (!user) {
        return <div>
            User session is not available. Please log in.
            <LoginButton>
                <Button size={"lg"} >Login</Button>
            </LoginButton>

        </div>
    }

    const userId = user?.id
    const page = typeof searchParams.page === "string" ? Number(searchParams.page) : 1
    const searchQuery = typeof searchParams.q === "string" ? searchParams.q : ""
    const ITEM_PER_PAGE = 4;

    const queryClause = {
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
            //@ts-ignore
            where: queryClause
        })

        const teacherData = await db.teacher.findMany({
            //@ts-ignore
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
        revalidateTag("teacher")


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

        return (
            <div>
                <Teachers teacherCount={teacherCount} teacherData={teacherData} bus={bus} />
                {/* <TeachersTable /> */}
            </div>
        )

    } catch (error) {
        console.error("Error fetching Parents data:", error);
        return <div className='text-center'>An error occurred while fetching Parents data, please refresh or try again later.</div>;
    }

}

export default TeachersDrivers