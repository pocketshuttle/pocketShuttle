import LoginButton from "@/components/auth/login-button";
import { Pagination } from "@/components/dashboard/pagination/pagination";
import { NetworkError } from "@/components/errorsandsuccess/error/error";
import StudentCard from "@/components/students/ui/student-card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useFetch } from "@/hooks/useFetch";
import db from "@/packages/db/client";
import { getUserSession } from "@/lib/session";
import { StudentProps } from "@/types";

const AllStudents = async ({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) => {
    const user = await getUserSession()
    const resolvedSearchParams = await searchParams;
    const page = typeof resolvedSearchParams.page === "string" ? Number(resolvedSearchParams.page) : 1
    const searchQuery = typeof resolvedSearchParams.q === "string" ? resolvedSearchParams.q : "";
    // const gradeQuery = typeof resolvedSearchParams.grade === "string" ? resolvedSearchParams.grade : ""
    // const gradeQuery = typeof resolvedSearchParams.grade === "string" ? decodeURIComponent(resolvedSearchParams.grade) : "";
    const gradeQuery = typeof resolvedSearchParams.grade === "string"
        ? decodeURIComponent(decodeURIComponent(resolvedSearchParams.grade.replace(/\+/g, ' ')))
        : "";
    const ITEM_PER_PAGE = 10;

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

    const userId = user?.id
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
        })

        if (!students) {
            // Handle the case where teacher data is not found
            return <div>No Students data found for this user.</div>;
        }

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
        }

        return (
            <div className="mt-4">

                <div className=" flex gap-4 flex-wrap">
                    {students.map((student) => (
                        <StudentCard key={student.id} data={student} busData={bus} />
                    ))}
                    <Pagination count={count} pageCount={10} />
                </div>
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

export default AllStudents
