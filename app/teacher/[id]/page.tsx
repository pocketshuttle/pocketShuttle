"use client"
import { GuardianPage } from '@/components/teachers-view/student-view/guardian'
import { useFetch } from '@/hooks/useFetch'
import { usePathname } from 'next/navigation'

const StudentView = () => {
    const pathname = usePathname()
    const id = pathname.split("/").pop()
    const { data: studentsData, isPending, errorMessage } = useFetch(`/api/addstudent/${id}`, id);

    return (
        <div>


            <div>
                {
                    isPending ? <p>Loading</p> :
                        <GuardianPage data={studentsData} />
                }
            </div>
        </div>
    )
}

export default StudentView