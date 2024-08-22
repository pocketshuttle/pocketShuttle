import { getUserSession } from "@/lib/session"
import { ParentData } from "./ui/parent-table"

const Parent = async () => {
    const user = await getUserSession()

    return (
        <div>
            <ParentData userId={user?.id} />
        </div>
    )
}

export default Parent