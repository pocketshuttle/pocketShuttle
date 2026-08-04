import Navbar from "@/components/teachers-view/navbar"
import { getUserSession } from "@/lib/session"
import { ManagedWorkspaceSlot } from "@/components/admin/managed-workspace-slot"
const DashboardLayout = async ({ children }: { children: React.ReactNode }) => {
    const user = await getUserSession()
    return (
        <div className="min-h-screen bg-gray-100 text-black dark:bg-black dark:text-white">
            <ManagedWorkspaceSlot session={user} />
            <div>
                <Navbar data={user} />
            </div>
            {children}
        </div >
    )
}

export default DashboardLayout
