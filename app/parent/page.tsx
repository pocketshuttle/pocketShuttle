import LoginButton from '@/components/auth/login-button'
import { NetworkError } from '@/components/errorsandsuccess/error/error'
import { Button } from '@/components/ui/button'
import { getUserSession } from '@/lib/session'
import { revalidateTag } from 'next/cache'
import { Montserrat } from 'next/font/google'
import React, { Suspense } from 'react'
import { ParentMainView } from '@/components/parent-view/parent-view'
import NewParentPage from '@/components/parent-view/new-parent-view'
import db from '@/packages/db/client'

// Load Montserrat font
const mont = Montserrat({ subsets: ["latin"], weight: "500" })

const TeacherView = async () => {
    const user = await getUserSession()

    // Redirect to login if no user session
    if (!user || typeof user.id !== 'string') {
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

    const id = user?.id
    try {
        const parent = await db.parent.findUnique({
            where: {
                id: id
            },
            select: {
                id: true,
                address: true,
                addressCoords: true,
                Student: {
                    select: {
                        id: true,
                        full_name: true,
                        image: true,
                        status: true,
                        bus: {
                            select: {
                                id: true,
                                color: true,
                                bus_product_name: true,
                                bus_number: true,
                                teacher: {
                                    select: {
                                        id: true,
                                        full_name: true,
                                        phoneNumber: true,
                                        image: true
                                    }
                                },
                                driver: {
                                    select: {
                                        id: true,
                                        full_name: true,
                                        phoneNumber: true
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });

        if (!parent) {
            // Handle case where no parent data is found
            return (
                <div className="text-center flex items-center justify-center h-screen">
                    <p>No Parent data found for this user. Please refresh or contact the school admin.</p>
                </div>
            );
        }

        // Trigger revalidation for student cache tag
        revalidateTag("students");
        revalidateTag("parent");

        return (
            <Suspense>
                <div className={`${mont.className}`}>
                    < NewParentPage parentAddress={parent.address ?? ''} parentAddressCoords={parent?.addressCoords} parentId={id} siblings={parent.Student as any} />
                    {/* <ParentMainView parentAddress={parent.address ?? ''} parentId={id} siblings={parent.Student as any} /> */}
                </div>
            </Suspense>
        )

    } catch (error: any) {
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

export default TeacherView
