import Alert from "@/components/dashboard/news/news"
import { DashboardWrapper } from "@/components/dashboard/wrapper/dashboard-Wrapper"
import ActiveCommute from "@/components/dashboard/activecommute/active"
import { Charts } from "@/components/dashboard/chart/charts"
import { CommuteTable } from "@/components/commute/ui/commute-table"
import LoginButton from "@/components/auth/login-button"
import { Button } from "@/components/ui/button"
import { getUserSession } from "@/lib/session"
import { revalidateTag } from "next/cache"
import Location from "@/components/maps/Map/new-map"
import { NetworkError } from "@/components/errorsandsuccess/error/error"
import db from "@/packages/db/client"
// import Location from "@/components/maps/Map/Map"


const Dashboard = async () => {
    const user = await getUserSession()
    // if no user, that means you havent logged in, so redirect back to login page
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
    try {

        const teacherCount = await db.teacher.count({
            where: {
                OR: [
                    { schoolId: userId },
                    { id: userId }
                ]
            }
        })

        const studentCount = await db.student.count({
            where: {
                OR: [
                    { schoolId: userId },
                    { id: userId }
                ]
            }
        });

        const busCount = await db.buses.count({
            where: {
                OR: [
                    { schoolId: userId },
                    { id: userId }
                ]
            }
        });
        const bus = await db.buses.findMany({
            where: {
                OR: [{ id: userId }, { schoolId: userId }],
            },
            include: {
                route: true,
                teacher: true,
                students: true,
                driver: true,
            },
        });
        revalidateTag("students")
        if (bus) {
            revalidateTag("bus")
        }

        return (
            <div className="flex w-full" >
                <div className="w-full lg:w-4/6">
                    <div className="flex w-full gap-2 justify-between p-2 ">
                        <div className="w-2/6">
                            <DashboardWrapper headLabel=" Buses" total={busCount} bgColor="#151618" service="bus" />
                        </div>
                        <div className="w-2/6">
                            <DashboardWrapper headLabel="Students" total={studentCount} bgColor="#151618" service="student" />
                        </div>
                        <div className="w-2/6">
                            <DashboardWrapper headLabel="Teachers" total={teacherCount} bgColor="#151618" />
                        </div>
                    </div>
                    {/* @ts-ignore */}
                    <CommuteTable userId={userId} />
                    {/* <Charts /> */}

                </div>

                <aside className="hidden lg:w-2/6 lg:block sticky p-4">
                    <Alert />
                </aside>

            </div>
        )
    } catch (error: any) {
        console.log(error, "connection errro")
        if (error.message.includes("Can't reach database server at")) {
            return <div className=" flex items-center justify-center">
                <NetworkError error="Connection" />
            </div>
        } else {
            <div className="flex items-center justify-center ">
                please refresh
            </div>
        }

    }
}

export default Dashboard