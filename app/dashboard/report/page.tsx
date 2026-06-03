import { NetworkError } from '@/components/errorsandsuccess/error/error';
import { MainPickUpPage } from '@/components/pick-logs/main-page'
import { getUserSession } from '@/lib/session';
import db from '@/packages/db/client';

export const dynamic = "force-dynamic";

const ReportPage = async () => {
    const user = await getUserSession();
    const schoolId = String(user?.schoolId ?? user?.id ?? "");

    if (!schoolId) {
        return (
            <div className="flex min-h-[360px] items-center justify-center rounded-lg border border-black/10 bg-white p-6 text-center text-black dark:border-white/10 dark:bg-zinc-950 dark:text-white">
                User session is not available. Please log in again.
            </div>
        );
    }

    try {
        const [teacherData, totals] = await Promise.all([
            db.teacher.findMany({
                where: { schoolId },
                select: {
                    Student: {
                        select: {
                            parent: { select: { address: true } },
                        },
                    },
                    bus: {
                        include: {
                            students: {
                                include: { parent: { select: { address: true } } }
                            },
                            driver: true,
                        },
                    },
                    full_name: true,
                    id: true,
                    busId: true
                },
                orderBy: { full_name: "asc" },
            }),
            db.$transaction([
                db.pickup.count({
                    where: {
                        Student: { schoolId },
                    },
                }),
                db.teacher.count({ where: { schoolId } }),
                db.buses.count({ where: { schoolId } }),
            ]),
        ]);

        return (
            <MainPickUpPage
                data={teacherData}
                summary={{
                    totalPickups: totals[0],
                    totalTeachers: totals[1],
                    totalBuses: totals[2],
                }}
            />
        )
    } catch (error: any) {
        if (error.message?.includes("Can't reach database server at")) {
            return (
                <div className="flex items-center justify-center">
                    <NetworkError error="Connection" />
                </div>
            );
        }
        return (
            <div className="flex min-h-[360px] items-center justify-center rounded-lg border border-black/10 bg-white p-6 text-center text-black dark:border-white/10 dark:bg-zinc-950 dark:text-white">
                <p>An error occurred while loading reports. Please refresh or try again later.</p>
            </div>
        );
    }

}

export default ReportPage
