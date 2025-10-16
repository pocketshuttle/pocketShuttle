import LoginButton from '@/components/auth/login-button'
import { DriverTable } from '@/components/driver/ui/Table'
import { NetworkError } from '@/components/errorsandsuccess/error/error'
import { Teachers } from '@/components/Teachers/teachers'
import { TeachersTable } from '@/components/Teachers/ui/TeacherTable'
import { Button } from '@/components/ui/button'
import { getUserSession } from '@/lib/session'
import db from '@/packages/db/client'

const Drivers = async ({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) => {
    const user = await getUserSession()

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
    const page = typeof searchParams.page === "string" ? Number(searchParams.page) : 1
    const searchQuery = typeof searchParams.q === "string" ? searchParams.q : ""
    const ITEM_PER_PAGE = 10;

    type DriverWhere = NonNullable<Parameters<typeof db.driver.findMany>[0]>['where']

    const queryClause: DriverWhere = {
        OR: [
            {
                schoolId: userId
            },
            {
                id: userId
            }
        ],
        //we check the search query has a value, all searches are cases insensitive
        // you can search by full_name

        ...(
            searchQuery && {
                full_name: { contains: searchQuery, mode: "insensitive" }
            }
        )
    }

    try {
        const driverCount = await db.driver.count({
            where: {
                schoolId: userId
            }
        })
       

        const driverData = await db.driver.findMany({
            where: queryClause,
            include: {
                bus: true,
            },
        });


        if (!driverData) {
            // Handle the case where parent data is not found
            return <div className='text-center flex items-center '>No Driver found data found for this user, please refresh or contact school admin.</div>;
        }
        return (
            <div>
                <Teachers />
                <DriverTable />
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

export default Drivers