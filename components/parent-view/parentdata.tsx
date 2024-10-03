"use client"
import { useFetch } from "@/hooks/useFetch"
import { StudentProps } from "@/types"
import Image from "next/image"
import avatar from "@/public/images/avatar.jpg"
import { Skeleton } from "@/components/ui/skeleton" // Import the Skeleton component

type SessionProps = {
    userId: string | undefined
    user: any
}

const ParentViewData = ({ userId, user }: SessionProps) => {
    const { data, isPending: parentPending, errorMessage } = useFetch(`/api/addparent/${userId}`, userId);

    const parentData = data?.parent?.[0]

    return (
        <main>
            <div>
                <h3 className="text-center p-5">All kids</h3>
                {
                    parentPending ? (
                        // Skeleton loader instead of Spinner
                        Array.from({ length: 3 }).map((_, index) => (
                            <div
                                key={index}
                                className="flex items-center bg-[var(--bgSoft)] py-2 px-4 space-x-4 rounded-md mb-2"
                            >
                                <Skeleton className="rounded-md object-cover w-24 h-24 shadow-lg" />

                                <div className="py-4 space-y-2 w-full">
                                    <Skeleton className="h-4 w-1/2" />
                                    <Skeleton className="h-4 w-1/3" />
                                    <div className="space-y-1">
                                        <Skeleton className="h-4 w-2/3" />
                                        <Skeleton className="h-4 w-2/3" />
                                        <Skeleton className="h-4 w-2/3" />
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        parentData?.Student?.map((sibling: StudentProps) => {
                            const bus = sibling?.bus
                            const driver = sibling?.bus?.driver
                            const teacher = sibling?.bus?.teacher

                            return (
                                <div
                                    key={sibling.id}
                                    className="flex items-center bg-[var(--bgSoft)] py-2 px-4 space-x-4 rounded-md mb-2"
                                >
                                    <Image
                                        src={sibling?.image || avatar}
                                        alt={sibling?.full_name}
                                        className="rounded-md object-cover w-24 h-24 shadow-lg"
                                        width={100}
                                        height={100}
                                    />
                                    <div className="py-4 space-y-2">
                                        <h2 className="capitalize text-gray-200">
                                            {sibling?.full_name}
                                        </h2>
                                        <span>
                                            {sibling.status}
                                        </span>
                                        <div>
                                            <p>
                                                <span>
                                                    {bus?.color}
                                                </span>
                                                <span className="ml-2">
                                                    {bus?.bus_product_name}
                                                </span>
                                                <span className="ml-2">
                                                    {bus?.bus_number}
                                                </span>
                                            </p>
                                            <p className="space-x-2 capitalize">
                                                {driver?.full_name}
                                                <small className="ml-2">
                                                    {driver?.phoneNumber}
                                                </small>
                                            </p>
                                            <p className="space-x-2 capitalize">
                                                {teacher?.full_name}
                                                <small className="ml-2">
                                                    {teacher?.phoneNumber}
                                                </small>
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )
                }
            </div>
        </main>
    )
}

export default ParentViewData
