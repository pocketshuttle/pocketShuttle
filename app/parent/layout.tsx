import ParentNavbar from "@/components/parent-view/navbar"
import { getUserSession } from "@/lib/session"
import db from "@/packages/db/client"
import { ManagedWorkspaceSlot } from "@/components/admin/managed-workspace-slot"

async function getParentNavContext(userId?: string) {
    if (!userId) return null

    try {
        return await db.parent.findUnique({
            where: { id: userId },
            select: { accountType: true, schoolId: true },
        })
    } catch (error) {
        console.error("Parent layout failed to load nav context:", error)
        return null
    }
}

const DashboardLayout = async ({ children }: { children: React.ReactNode }) => {
    const user = await getUserSession()
    const parent = user?.role === "parent" && typeof user.id === "string" ? await getParentNavContext(user.id) : null
    const showAddKid = parent?.accountType === "STANDALONE" && parent.schoolId === null
    const showAddDriver = showAddKid

    return (
        <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-gray-100 text-black">
            <ManagedWorkspaceSlot session={user} />
            <div className="w-full max-w-full overflow-x-hidden">
                <ParentNavbar data={user} showAddKid={showAddKid} showAddDriver={showAddDriver} />
            </div>
            {children}
        </div >
    )
}

export default DashboardLayout
