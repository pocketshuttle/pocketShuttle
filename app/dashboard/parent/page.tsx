import LoginButton from '@/components/auth/login-button'
import { ParentData } from '@/components/parent/ui/parent-table'
import { Button } from '@/components/ui/button'
import { getUserSession } from '@/lib/session'
import { revalidateTag } from 'next/cache'
import db from "@/packages/db/client";
import { Prisma } from "@prisma/client";
import { NetworkError } from '@/components/errorsandsuccess/error/error'


const Parents = async ({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) => {
    const user = await getUserSession()

    // if no user, that means you havent logged in, so redirect back to login page
    if (!user || typeof user?.id !== "string") {
        return <div className="flex items-center justify-center">
            User session is not available. Please log in.
            <LoginButton>
                <Button size={"lg"} >Login</Button>
            </LoginButton>

        </div>
    }
    const userId = user?.id
    //if the next req for the next page is a string, we convert it to number then pass it as a params, if its unavailable , we set it to 1
    const page = typeof searchParams.page === "string" ? Number(searchParams.page) : 1
    const searchQuery = typeof searchParams.q === "string" ? searchParams.q : ""
    const ITEM_PER_PAGE = 10;

    const query: Prisma.ParentWhereInput = {
        //we fetch our data by either school id or user Id
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
        }),
    }
    try {
        const parentCount = await db.parent.count({
            where: {
                id: userId
            }
        });

        const parent = await db.parent.findMany({
            where: query,
            include: {
                Student: {
                    include: {
                        bus: {
                            include: {
                                teacher: true,
                                driver: true,
                            },
                        },
                    },
                },
            },
            take: ITEM_PER_PAGE,
            skip: (page - 1) * ITEM_PER_PAGE,
        });

        if (!parent) {
            // Handle the case where teacher data is not found
            return <div className='text-center'>No parent data found for this user, try again or add a Parent</div>;
        }
        revalidateTag("parent");

        const studentData = await db.student.findMany({
            where: {
                OR: [
                    {
                        schoolId: userId,
                    },
                    {
                        id: userId,
                    },
                ],
            }
        })

        return (
            <div>
                <ParentData parentData={parent} totalCount={parentCount} studentData={studentData} />
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

export default Parents