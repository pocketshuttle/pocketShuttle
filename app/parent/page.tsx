import LoginButton from '@/components/auth/login-button'
import { NetworkError } from '@/components/errorsandsuccess/error/error'
import { Button } from '@/components/ui/button'
import { getUserSession } from '@/lib/session'
import { unstable_noStore as noStore } from 'next/cache'
import { Prisma } from '@prisma/client'
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
            const [children, connections, invites] = await Promise.all([
                db.parentChild.findMany({
                    where: { parentId: parent.id },
                    orderBy: { createdAt: "desc" },
                }),
                db.parentDriverConnection.findMany({
                    where: { parentId: parent.id },
                    include: {
                        driver: {
                            select: {
                                id: true,
                                full_name: true,
                                phoneNumber: true,
                                image: true,
                                liveAddress: true,
                                verificationStatus: true,
                                shareProfile: { select: { shareId: true } },
                            },
                        },
                                assignments: {
                            include: {
                                child: true,
                                events: {
                                    where: {
                                        eventType: { in: ["ON_THE_WAY_TO_SCHOOL", "PICKED_UP", "DROPPED_OFF"] },
                                    },
                                    orderBy: { createdAt: "desc" },
                                    take: 20,
                                },
                                payments: { orderBy: { createdAt: "desc" }, take: 1 },
                            },
                            orderBy: { createdAt: "desc" },
                        },
                    },
                    orderBy: { updatedAt: "desc" },
                }),
                db.driverInvite.findMany({
                    where: { parentId: parent.id },
                    orderBy: { createdAt: "desc" },
                    take: 20,
                }),
            ]);
            const schoolCoordRows = await db.$queryRaw<Array<{ id: string; address: string | null; schoolCoords: unknown }>>`
                SELECT "id", "address", "school_coords" AS "schoolCoords"
                FROM "parent_children"
                WHERE "parent_id" = ${parent.id}
            `;
            const schoolCoordsByChildId = new Map(schoolCoordRows.map((row) => [row.id, row.schoolCoords]));
            const schoolCoordsByAddress = new Map(
                schoolCoordRows
                    .filter((row) => row.address && row.schoolCoords)
                    .map((row) => [row.address!.trim().toLowerCase(), row.schoolCoords])
            );
            const childrenWithSchoolCoords = children.map((child) => ({
                ...child,
                schoolCoords:
                    schoolCoordsByChildId.get(child.id) ??
                    (child.address ? schoolCoordsByAddress.get(child.address.trim().toLowerCase()) : null) ??
                    null,
            }));
            const driverIds = Array.from(new Set(connections.map((connection) => connection.driver.id)));
            const driverActivityRows = driverIds.length
                ? await db.$queryRaw<Array<{ id: string; lastActiveAt: Date | null }>>`
                    SELECT "id", "last_active_at" AS "lastActiveAt"
                    FROM "Driver"
                    WHERE "id" IN (${Prisma.join(driverIds)})
                `
                : [];
            const driverActivityById = new Map(driverActivityRows.map((row) => [row.id, row.lastActiveAt]));
            const connectionsWithDriverActivity = connections.map((connection) => ({
                ...connection,
                driver: {
                    ...connection.driver,
                    lastActiveAt: driverActivityById.get(connection.driver.id) ?? null,
                },
            }));

            return (
                <Suspense>
                    <div className="min-h-screen bg-gray-100 text-black">
                        <StandaloneParentDashboard
                            parentId={parent.id}
                            parentName={parent.full_name}
                            childrenData={childrenWithSchoolCoords as any}
                            connectionsData={connectionsWithDriverActivity as any}
                            invitesData={invites as any}
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
