"use client"
import StudentCard from "@/components/students/ui/student-card";
import { useFetch } from "@/hooks/useFetch";
import { useSession } from "next-auth/react"

const AllStudents = () => {
    const { data: session } = useSession()
    const userId = session?.user?.id

    const { data: studentsData, isPending, errorMessage } = useFetch(`/api/addstudent/${userId}`, userId);
    console.log(studentsData)
    return (
        <div className="mt-4">
            {isPending && <p>Loading...</p>}
            {errorMessage && <p>{errorMessage}</p>}
            <div className=" flex gap-4">


                {studentsData && studentsData.map((student) => (
                    <StudentCard data={student} />
                ))}

            </div>
        </div>
    )
}

export default AllStudents