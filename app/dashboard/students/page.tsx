import LoginButton from "@/components/auth/login-button";
import { Student } from "@/components/students/students"
import { StudentsData } from "@/components/students/ui/Table";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";
import { getUserSession } from "@/lib/session";
import { revalidateTag } from "next/cache";

const Students = async ({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) => {
    const user = await getUserSession();

    const page = typeof searchParams.page === "string" ? Number(searchParams.page) : 1
    const searchQuery = typeof searchParams.q === "string" ? searchParams.q : "";
    // const gradeQuery = typeof searchParams.grade === "string" ? searchParams.grade : ""
    // const gradeQuery = typeof searchParams.grade === "string" ? decodeURIComponent(searchParams.grade) : "";
    const gradeQuery = typeof searchParams.grade === "string"
        ? decodeURIComponent(decodeURIComponent(searchParams.grade.replace(/\+/g, ' ')))
        : "";
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
        revalidateTag("students");

        const count = await db.student.count({
            //@ts-ignore
            where: query,
        });

        const bus = await db.buses.findMany({
            where: {
                OR: [{ id: user?.id }, { schoolId: user?.id }],
            },
            include: {
                route: true,
                teacher: true,
                students: true,
                driver: true,
            },
        });

        if (bus) {
            revalidateTag("bus")
        }

        return (
            <div>
                {/* @ts-ignore */}
                <StudentsData studentsData={students} totalCount={count} busData={bus} />
            </div>
        )

    } catch (error) {
        console.error("Error fetching teacher data:", error);
        return <div>An error occurred while fetching student data.</div>;
    }

    console.log(gradeQuery, "next params from the server component ")


}

export default Students