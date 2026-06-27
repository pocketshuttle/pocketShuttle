"use server"
import { getUserSession } from "@/lib/session"
import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from "@/components/ui/avatar";
import LoginButton from "@/components/auth/login-button";
import { Button } from "@/components/ui/button";
// type userNameProps = {
//     isHovering: boolean

// }
export const UserName = async () => {
    const user = await getUserSession()
    if (!user || typeof user.name !== 'string' || typeof user.image !== 'string') {
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

