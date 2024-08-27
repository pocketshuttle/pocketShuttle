import LoginButton from "@/components/auth/login-button";
import { Student } from "@/components/students/students"
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";
import { getUserSession } from "@/lib/session";

const Students = async ({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) => {
    const user = await getUserSession();

    const page = typeof searchParams.page === "string" ? Number(searchParams.page) : 1
    const searchQuery = typeof searchParams.q === "string" ? searchParams.q : "";
    const gradeQuery = typeof searchParams.grade === "string" ? searchParams.grade : ""
    const ITEM_PER_PAGE = 4;

    if (!user) {
        return <div>
            User session is not available. Please log in.
            <LoginButton>
                <Button size={"lg"} >Login</Button>
            </LoginButton>

        </div>
    }
    const userId = user?.id;

    const query = {
        OR: [
            {
                schoolId: userId,
            },
            {
                id: userId,
            },
        ],
        //making the regex case insensitive
        ...(searchQuery && {
            full_name: { contains: searchQuery, mode: "insensitive" },
        }),
        ...(gradeQuery && gradeQuery !== "All" && { grade: gradeQuery }),
    };

    try {
        const students = await db.student.findMany({
            //@ts-ignore

            where: query,
            include: {
                bus: true,
                parent: {
                    include: {
                        Student: true,
                    },
                },
            },
            take: ITEM_PER_PAGE,
            skip: ITEM_PER_PAGE * (page - 1),
        });

        if (!students) {
            // Handle the case where teacher data is not found
            return <div>No Students data found for this user.</div>;
        }

        console.log(students)

    } catch (error) {
        console.error("Error fetching teacher data:", error);
        return <div>An error occurred while fetching student data.</div>;
    }

    console.log(gradeQuery, "next params from the server component ksdkei")



    return (
        <div>
            <Student />
        </div>
    )
}

export default Students