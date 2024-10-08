import Location from '@/components/maps/Map/new-map'
import { BusArrival } from '@/components/parent-view/bus-arrival'
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
                            parent: true
                        },
                    },
                },
            }
        }
    })

    // Revalidate the cache for the 'students' tag to ensure real-time data
    revalidateTag("students")

    if (!studentData?.parent) {
        // Handle the case where parent data is not found
        return <div className='text-center flex items-center '>No Parent found for this student, please refresh or contact school admin.</div>;
    }

    return (
        <div>
            <  BusArrival parentAddress={studentData?.parent?.address} parentId={studentData?.parent?.id} />
            {/* @ts-ignore */}
            <GuardianPage data={studentData} />

        </div>

    )
}

export default StudentView
