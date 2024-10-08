"use client"
import { useFetch } from "@/hooks/useFetch"
import { ParentProps, StudentProps } from "@/types"
import Image from "next/image"
import avatar from "@/public/images/avatar.jpg"
import { Skeleton } from "@/components/ui/skeleton" // Import the Skeleton component
import { Badge } from "@/components/ui/badge"

//@ts-ignore
const ParentViewData = ({ parentData }) => {
    console.log(parentData)
    return (
        <main>
            <div>
                <h3 className="text-center p-5">All kids</h3>
                {

                    parentData[0]?.Student?.map((sibling: StudentProps) => {
                        const bus = sibling?.bus
                        const driver = sibling?.bus?.driver
                        const teacher = sibling?.bus?.teacher

                        return (
                            <div
                                key={sibling.id}
                                className="flex items-center bg-[#606060]/10 py-2 px-4 space-x-4 rounded-md" >

                                <Image
                                    src={sibling?.image || avatar}
                                    alt={sibling?.full_name}
                                    className="rounded-md object-cover w-24 h-24 shadow-lg"
                                    width={100}
                                    height={100}
                                />
                                <div className="py-4 space-y-2 ">
                                    <h2 className="space-x-4 capitalize text-lg ">
                                        {sibling?.full_name}

                                        <small className={`ml-2 text-[#EEEEEE] text-[0.5rem] p-[0.2rem] rounded-md ${sibling.status === "PICKED" ? 'bg-[crimson]' : "bg-[teal]"}`}>
                                            {sibling.status}
                                        </small>
                                    </h2>
                                    <div>
                                        <p className="capitalize text-[#7B7B7B]">
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
                                            <small className="text-[#B4B4B4]">
                                                {driver?.full_name}
                                            </small>

                                            <small className="ml-2 text-lg">
                                                {driver?.phoneNumber}
                                            </small>
                                        </p>
                                        <p className="space-x-2 capitalize">
                                            <small className="text-[#B4B4B4]">

                                                {teacher?.full_name}
                                            </small>
                                            <small className="ml-2 text-lg">
                                                {teacher?.phoneNumber}
                                            </small>
                                        </p>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                }

            </div>
        </main>
    )
}

export default ParentViewData
