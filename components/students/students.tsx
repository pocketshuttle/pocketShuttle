import { StudentsData } from "@/components/students/ui/Table"
import { getUserSession } from "@/lib/session"

export const Student = async () => {
    const user = await getUserSession()
    return (
        <div className="mt-2">
            <StudentsData userId={user?.id} />
        </div>
    )
}