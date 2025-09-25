import Location from '@/components/maps/Map/new-map'
import { BusArrival } from '@/components/parent-view/bus-arrival'
import { SocketDebugPanel } from '@/components/socket/socket-debug-panel'
// import Location from '@/components/maps/Map/Map'
import { GuardianPage } from '@/components/teachers-view/student-view/guardian'
import { db } from '@/lib/db'
import { getUserSession } from '@/lib/session'
import { revalidateTag } from 'next/cache'


/**
 * 
 * This component shows the parent of the child, the parent is fetched from the students data
 * each child can have just one parent, but parents can have multiple kids
 * @returns 
 */

const StudentView = async ({ params }: { params: { id: string } }) => {

    const user = await getUserSession()
    // Use teacherId if avaiable, else use user id
    const teacherId = user?.teacherId || user?.id;

    if (!user || !teacherId) {
        // If the user is not authenticated, redirect to the login page
        return <div className='text-center flex items-center '>You are not logged in, please login to view this page.</div>;
    }

    const studentData = await db.student.findUnique({
        where: { id: params.id },
        include: {
            parent: {
                include: {
                    Student: {
                        include: {
                            bus: {
                                include: {
                                    teacher: true,
                                    driver: true,
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
            <BusArrival parentAddress={studentData?.parent?.address || ""} parentId={studentData?.parent?.id} teacherId={teacherId || ""} page="coordinator_view" />
            {/* @ts-ignore */}
            <GuardianPage data={studentData} />
        </div>

    )
}

export default StudentView
