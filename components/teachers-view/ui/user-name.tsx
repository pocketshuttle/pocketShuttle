"use server"
import { getUserSession } from "@/lib/session"
import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from "@/components/ui/avatar";
// type userNameProps = {
//     isHovering: boolean

// }
export const UserName = async () => {
    const user = await getUserSession()
    return (
        <div>
            <Avatar>
                {user?.image &&
                    <AvatarImage src={user?.image} alt="@shadcn" />
                }

            </Avatar>
            <div className="flex flex-col items-start ">
                <span className="text-[1.5rem] font-medium capitalize">{user?.name || "admin"}</span>
            </div>
        </div>
    )
}

