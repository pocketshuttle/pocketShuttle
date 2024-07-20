"use client"
import { useFetch } from "@/hooks/useFetch";
import { useSession } from "next-auth/react"

const AllStudents = () => {
    const { data: studentsData, isPending, errorMessage } = useFetch(`/api/addstudent/${userId}`, userId);
    const { data: session } = useSession()
    const userId = session?.user?.id
    return (
        <div>AllStudents</div>
    )
}

export default AllStudents