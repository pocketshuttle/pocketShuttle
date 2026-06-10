import LoginButton from '@/components/auth/login-button'
import { NetworkError } from '@/components/errorsandsuccess/error/error'
import { Button } from '@/components/ui/button'
import { getUserSession } from '@/lib/session'
import { unstable_noStore as noStore } from 'next/cache'
import React, { Suspense } from 'react'
import NewParentPage from '@/components/parent-view/new-parent-view'
import { StandaloneParentDashboard } from '@/components/parent-view/standalone-parent-dashboard'
import db from '@/packages/db/client'

export const dynamic = "force-dynamic"
export const revalidate = 0

const TeacherView = async () => {
    noStore()
    const user = await getUserSession()

    // Redirect to login if no user session
    if (!user || typeof user.id !== 'string') {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4 text-black">
                <div className="text-center">
                    <p className="mb-4 text-black/70">User session is not available. Please log in.</p>
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
                accountType: true,
                schoolId: true,
                full_name: true,
                address: true,
                addressCoords: true,
                Student: {
                    select: {
                        id: true,
                        full_name: true,
                        image: true,
                        status: true,
                        presence: true,
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
                <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4 text-center text-black">
                    <p className="text-black/70">No Parent data found for this user. Please refresh or contact the school admin.</p>
                </div>
            );
        }

        if (parent.accountType === "STANDALONE" && parent.schoolId === null) {
            const [children, drivers, requests] = await Promise.all([
                db.parentChild.findMany({
                    where: { parentId: parent.id },
                    include: {
                        activeDriver: {
                            select: {
                                id: true,
                                full_name: true,
                                phoneNumber: true,
                                liveAddress: true,
                                serviceAreas: true,
                                verificationStatus: true,
                                carMake: true,
                                carModel: true,
                                carColor: true,
                                plateNumber: true,
                                vehicleCapacity: true,
                            },
                        },
                    },
                    orderBy: { createdAt: "desc" },
                }),
                db.driver.findMany({
                    where: {
                        accountType: "STANDALONE",
                        schoolId: null,
                    },
                    select: {
                        id: true,
                        full_name: true,
                        liveAddress: true,
                        image: true,
                        serviceAreas: true,
                        verificationStatus: true,
                        carMake: true,
                        carModel: true,
                        carColor: true,
                        plateNumber: true,
                        vehicleCapacity: true,
                    },
                    orderBy: { full_name: "asc" },
                }),
                db.driverRequest.findMany({
                    where: { parentId: parent.id },
                    include: {
                        child: true,
                        driver: {
                            select: {
                                id: true,
                                full_name: true,
                                phoneNumber: true,
                                liveAddress: true,
                                serviceAreas: true,
                                verificationStatus: true,
                                carMake: true,
                                carModel: true,
                                carColor: true,
                                plateNumber: true,
                                vehicleCapacity: true,
                            },
                        },
                    },
                    orderBy: { createdAt: "desc" },
                }),
            ]);

            const acceptedLoads = drivers.length
                ? await db.driverRequest.groupBy({
                    by: ["driverId"],
                    where: {
                        driverId: { in: drivers.map((driver) => driver.id) },
                        status: "ACCEPTED",
                        droppedOffAt: null,
                    },
                    _count: { _all: true },
                })
                : [];
            const loadByDriverId = new Map(
                acceptedLoads.map((load) => [load.driverId, load._count._all])
            );
            const driversWithAvailability = drivers.map((driver) => {
                const usedSeats = loadByDriverId.get(driver.id) || 0;
                const capacity = driver.vehicleCapacity || 0;
                const availableSeats = capacity ? Math.max(capacity - usedSeats, 0) : null;

                return {
                    ...driver,
                    usedSeats,
                    availableSeats,
                    isFull: capacity ? usedSeats >= capacity : false,
                };
            });

            return (
                <Suspense>
                    <div className="min-h-screen bg-gray-100 text-black">
                        <StandaloneParentDashboard
                            parentName={parent.full_name}
                            childrenData={children as any}
                            driversData={driversWithAvailability as any}
                            requestsData={requests as any}
                        />
                    </div>
                </Suspense>
            )
        }

        return (
            <Suspense>
                <div className="min-h-screen bg-gray-100 text-black">
                    < NewParentPage parentAddress={parent.address ?? ''} parentAddressCoords={parent?.addressCoords} parentId={id} siblings={parent.Student as any} />
                </div>
            </Suspense>
        )

    } catch (error: any) {
        console.error("Parent page failed:", error);
        if (error instanceof Error && error.message.includes("Can't reach database server at")) {
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
