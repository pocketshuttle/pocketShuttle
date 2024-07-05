import Alert from "@/components/dashboard/news/news"
import { DashboardWrapper } from "@/components/dashboard/wrapper/dashboard-Wrapper"
import ActiveCommute from "@/components/dashboard/activecommute/active"
import { Charts } from "@/components/dashboard/chart/charts"

const Dashboard = () => {
    return (
        <div className="flex w-full" >
            <div className="w-4/6">
                <div className="flex w-full gap-2 justify-between p-2 ">
                    <div className="w-2/6">
                        <DashboardWrapper headLabel="Total Number of Teachers" total={100} growth="20% for past week" />
                    </div>
                    <div className="w-2/6">
                        <DashboardWrapper headLabel="Total Number of Teachers" total={100} growth="20% for past week" />
                    </div>
                    <div className="w-2/6">
                        <DashboardWrapper headLabel="Total Number of Teachers" total={100} growth="20% for past week" />
                    </div>
                </div>
                <ActiveCommute />
                <Charts />
            </div>

            <aside className="w-2/6 sticky p-4">
                <Alert />
            </aside>

        </div>
    )
}

export default Dashboard