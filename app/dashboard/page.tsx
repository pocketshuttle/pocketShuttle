import Alert from "@/components/dashboard/news/news"
import { DashboardWrapper } from "@/components/dashboard/wrapper/dashboard-Wrapper"
import ActiveCommute from "@/components/dashboard/activecommute/active"
import { Charts } from "@/components/dashboard/chart/charts"
import { CommuteTable } from "@/components/commute/ui/commute-table"
import { db } from "@/lib/db"
import LoginButton from "@/components/auth/login-button"
import { Button } from "@/components/ui/button"
import { getUserSession } from "@/lib/session"

const Dashboard = async () => {
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
            // schoolId: userId
        }
    });


    return (
        <div className="flex w-full" >
            <div className="w-4/6">
                <div className="flex w-full gap-2 justify-between p-2 ">
                    <div className="w-2/6">
                        <DashboardWrapper headLabel="Total Number of Buses" total={busCount} />
                    </div>
                    <div className="w-2/6">
                        <DashboardWrapper headLabel="Total Number of Students" total={studentCount} />
                    </div>
                    <div className="w-2/6">
                        <DashboardWrapper headLabel="Total Number of Teachers" total={teacherCount} />
                    </div>
                </div>
                <CommuteTable userId={userId} />
                {/* <Charts /> */}
            </div>

            <aside className="w-2/6 sticky p-4">
                <Alert />
            </aside>

        </div>
    )
}

export default Dashboard