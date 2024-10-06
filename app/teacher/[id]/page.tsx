import Location from '@/components/maps/Map/new-map'
// import Location from '@/components/maps/Map/Map'
import { GuardianPage } from '@/components/teachers-view/student-view/guardian'
import { db } from '@/lib/db'
import { revalidateTag } from 'next/cache'


/**
 * 
 * This component shows the parent of the child, the parent is fetched from the students data
 * each child can have just one parent, but parents can have multiple kids
 * @returns 
 */

const StudentView = async ({ params }: { params: { id: string } }) => {
    const studentData = await db.student.findUnique({
        where: { id: params.id },
        include: {
            parent: {
                include: {
                    Student: {
                        include: {
                            bus: {
                                include: {
                                    teacher: true,  // Include the teacher assigned to the bus
                                    driver: true,   // Include the driver assigned to the bus
                                },
                            },
                        },
                    },
                },
            }
        }
    })
    // Revalidate the cache for the 'students' tag to ensure real-time data
    revalidateTag("students")

    return (
        <div>
            {/* <Location address={studentData?.address} /> */}
            {/* @ts-ignore */}
            <GuardianPage data={studentData} />

        </div>

    )
}

export default StudentView
