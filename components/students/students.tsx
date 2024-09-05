import { StudentsData } from "@/components/students/ui/Table";
import { getUserSession } from "@/lib/session";
import LoginButton from "../auth/login-button";
import { Button } from "../ui/button";

export const Student = async () => {
    const user = await getUserSession();
    const userId = user?.id;
    if (!user) {
        return <div>
            User session is not available. Please log in.
            <LoginButton>
                <Button size={"lg"} >Login</Button>
            </LoginButton>

        </div>
    }


    return (
        <div className="mt-2">
            {/* @ts-ignore */}
            <StudentsData />
        </div>
    );
};
