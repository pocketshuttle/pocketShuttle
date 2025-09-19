import LoginButton from "@/components/auth/login-button";
import { NetworkError } from "@/components/errorsandsuccess/error/error";
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
    const ITEM_PER_PAGE = 20;

    // if no user, that means you havent logged in, so redirect back to login page
    if (!user || typeof user.id !== 'string') {
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
            where: {
                id: userId
            }
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
                <StudentsData studentsData={students} totalCount={count} busData={bus} schooldId={userId} />
            </div>
        )

    } catch (error: any) {
        if (error.message.includes("Can't reach database server at")) {
            return <div className=" flex items-center justify-center">
                <NetworkError error="Connection" />
            </div>
        } else {
            <div className="flex items-center justify-center ">
                please refresh
            </div>
        }
    }



}

export default Students