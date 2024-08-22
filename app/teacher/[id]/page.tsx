"use client"
import { GuardianPage } from '@/components/teachers-view/student-view/guardian'
import { Spinner } from '@/components/ui/spinner'
import { useFetch } from '@/hooks/useFetch'
import { usePathname } from 'next/navigation'
/**
 * 
 * This component shows the parent of the child, the oarent is fetched from the students data
 * each child can have just one parent, but parents can have multiple kids
 * @returns 
 */
const StudentView = () => {
    const pathname = usePathname()
    const id = pathname.split("/").pop()
    const { data: studentsData, isPending, errorMessage } = useFetch(`/api/addstudent/${id}`, id);

    return (
        <div>
            <div>
                {
                    isPending ? <Spinner /> :
                        <GuardianPage data={studentsData} />
                }
            </div>
        </div>
    )
}

export default StudentView