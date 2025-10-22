import LoginButton from '@/components/auth/login-button'
import { NetworkError } from '@/components/errorsandsuccess/error/error'
import { StudentHomePage } from '@/components/teachers-view/student-view/student-home-page'
import { Button } from '@/components/ui/button'
import { getUserSession } from '@/lib/session'
import db from '@/packages/db/client'
import { StudentProps } from '@/types'
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
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-center">
                    <p>User session is not available. Please log in.</p>
                    <LoginButton>
                        <Button size="lg">Login</Button>
                    </LoginButton>
                </div>
            </div>
        )
    }
    try {
        //@ts-ignore
        const studentData: StudentProps = await db.student.findUnique({
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
                <StudentHomePage studentData={studentData} teacherId={teacherId as string} />
            </div>

        )
    } catch (error :any) {
        if (error.message.includes("Can't reach database server at")) {
            return (
                <div className="flex items-center justify-center">
                    <NetworkError error="Connection" />
                </div>
            );
        } else {
            return (
                <div className="flex items-center justify-center min-h-screen text-red-600">
                    <p>An error occurred. Please refresh or try again later.</p>
                </div>
            );
        }
    }

}

export default StudentView
