import Location from '@/components/maps/Map/new-map'
// import Location from '@/components/maps/Map/Map'
import { GuardianPage } from '@/components/teachers-view/student-view/guardian'
import { Skeleton } from '@/components/ui/skeleton'
import { db } from '@/lib/db'
import { revalidateTag } from 'next/cache'


/**
 * 
 * This component shows the parent of the child, the parent is fetched from the students data
 * each child can have just one parent, but parents can have multiple kids
 * @returns 
 */

const StudentView = async ({ params }: { params: { id: string } }) => {
    // const { data: studentsData, isPending, errorMessage } = useFetch(`/api/addstudent/${id}`, id);
    const studentData = await db.student.findUnique({
        where: { id: params.id },
        include: {
            parent: true
        }
    })
    revalidateTag("students")

    return (
        <div>
            <Location address={studentData?.address} />
            <GuardianPage data={studentData} />

        </div>

    )
}

export default StudentView
