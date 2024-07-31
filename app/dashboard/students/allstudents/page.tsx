"use client"
import StudentCard from "@/components/students/ui/student-card";
import { Spinner } from "@/components/ui/spinner";
import { useFetch } from "@/hooks/useFetch";
import { StudentProps } from "@/types";
import { useSession } from "next-auth/react"

const AllStudents = () => {
    const { data: session } = useSession()
    const userId = session?.user?.id

    const { data: studentsData, isPending, errorMessage } = useFetch(`/api/addstudent/${userId}?all=`, userId);
    return (
        <div className="mt-4">
            {isPending && <Spinner />}
            {errorMessage && <p>{errorMessage}</p>}
            <div className=" flex gap-4 flex-wrap">
                {studentsData && studentsData.students.map((student: StudentProps) => (
                    <StudentCard data={student} />
                ))}

            </div>
        </div>
    )
}

export default AllStudents