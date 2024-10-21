"use client"
import { useFetch } from "@/hooks/useFetch"
import { ParentProps, StudentProps } from "@/types"
import Image from "next/image"
import avatar from "@/public/images/avatar.jpg"
import { Skeleton } from "@/components/ui/skeleton" // Import the Skeleton component
import { Badge } from "@/components/ui/badge"


//@ts-ignore
const ParentViewData = ({ parentData }) => {
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
                                className="max-w-lg mx-auto bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 flex items-center px-2">
                                <div className="relative ">
                                    <Image className="w-24 h-24 mb-3 rounded-sm shadow-lg" src={sibling?.image || avatar} alt="Hotel Image" width={200} height={200} />

                                </div>

                                <div className="p-4">
                                    <div className=" flex items-center space-x-4">
                                        <h2 className="text-xl font-semibold text-gray-900">  {sibling?.full_name}</h2>
                                        <Badge variant="outline" className={`text-[#EEEEEE] text-[0.5rem] ${sibling.status === "PICKED" ? 'bg-[crimson]' : "bg-[teal]"}`}> {sibling.status}</Badge>
                                    </div>
                                    <p className="capitalize text-gray-500">
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
                                    <p className="space-x-2 capitalize text-gray-600">
                                        <small className="">
                                            {driver?.full_name}
                                        </small>

                                        <small className="ml-2 text-lg">
                                            {driver?.phoneNumber}
                                        </small>
                                    </p>
                                    <p className="space-x-2 capitalize">
                                        <small className="text-[#111111]">

                                            {teacher?.full_name}
                                        </small>
                                        <small className="ml-2 text-lg text-[#111111] ">
                                            {teacher?.phoneNumber}
                                        </small>
                                    </p>
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
