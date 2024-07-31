"use client"
import Alert from "@/components/dashboard/news/news"
import { DashboardWrapper } from "@/components/dashboard/wrapper/dashboard-Wrapper"
import ActiveCommute from "@/components/dashboard/activecommute/active"
import { Charts } from "@/components/dashboard/chart/charts"
import { useSession } from "next-auth/react"
import { useFetch } from "@/hooks/useFetch"
import { CommuteTable } from "@/components/commute/ui/commute-table"

const Dashboard = () => {
    const { data: session } = useSession()
    const userId = session?.user?.id

    const { data: busData, isPending, errorMessage } = useFetch(`/api/addbus/${userId}`, userId);
    const { data: studentsData, } = useFetch(`/api/addstudent/${userId}`, userId);
    const { data: teachersData, } = useFetch(`/api/addteacher/${userId}`, userId);
    const { data: driversData, } = useFetch(`/api/adddriver/${userId}`, userId);
    const { data: routeData, } = useFetch(`/api/addroute/${userId}`, userId);

    console.log(routeData);

    return (
        <div className="flex w-full" >
            <div className="w-4/6">
                <div className="flex w-full gap-2 justify-between p-2 ">
                    <div className="w-2/6">
                        <DashboardWrapper headLabel="Total Number of Buses" total={busData?.length} />
                    </div>
                    <div className="w-2/6">
                        <DashboardWrapper headLabel="Total Number of Students" total={studentsData?.count} />
                    </div>
                    <div className="w-2/6">
                        <DashboardWrapper headLabel="Total Number of Teachers" total={teachersData?.count} />
                    </div>
                </div>
                <CommuteTable />
                {/* <Charts /> */}
            </div>

            <aside className="w-2/6 sticky p-4">
                <Alert />
            </aside>

        </div>
    )
}

export default Dashboard