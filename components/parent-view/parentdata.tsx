"use client";

import { ParentProps, StudentProps } from "@/types";
import Image from "next/image";
import avatar from "@/public/images/avatar.jpg";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import useSWR from "swr";
import { FormError } from "../errorsandsuccess/form-error";
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

import arriving from "@/public/images/arriving.json";
import { StudentNotificationBar } from "./notification-bar";
import { TeacherDetailsForParentPage } from "./teacher-details";
const fetcher = (url: string) => fetch(url).then((res) => res.json());

//we only show the teacher dertails when the student has OTW marked

const ParentViewData = ({ userId }: { userId: string }) => {
    const { data: parentData, error, isLoading } = useSWR<ParentProps>(
        `/api/addparent/${userId}`,
        fetcher,
        {
            refreshInterval: 10000,
            revalidateOnFocus: true,
        }
    );

    if (error) return <FormError message="Error fetching data" />;

    if (isLoading) {
        return (
            <div className="max-w-lg mx-auto bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 flex items-center px-2">
                <div>
                    <Skeleton className="w-24 h-24 mb-3 rounded-sm shadow-lg" />
                </div>
                <div className="space-y-2">
                    <Skeleton className="h-8 w-[250px]" />
                    <Skeleton className="h-8 w-[200px]" />
                </div>
            </div>
        );
    }


    //then we filter the kids that their teacher or bus is currently on the way
    const studentPresense = parentData?.Student?.filter((student: StudentProps) => (
        student.presence === "ON_THE_WAY"
    ))

    return (
        <main className=" " >
            {/* <StudentNotificationBar /> */}
            {
                studentPresense?.map((studentBus) => (
                    <TeacherDetailsForParentPage bus={studentBus?.bus} />
                ))
            }
            <h3 className="text-center text-gray-950 font-medium text-xl rounded-tl-lg p-5 ">All kids</h3>
            <section className="bg-white rounded-t-xl space-y-3">
                {parentData?.Student?.map((sibling: StudentProps) => {
                    const { bus } = sibling;
                    const driver = bus?.driver;
                    const teacher = bus?.teacher;


                    return (

                        <div
                            key={sibling.id}
                            className="max-w-lg mx-auto space-x-2  rounded-lg shadow-md overflow-hidden flex items-center px-2 mb-4"
                        >

                            <div className="relative">
                                <Image
                                    className="w-24 h-24 mb-3 rounded-sm shadow-lg"
                                    src={sibling?.image || avatar}
                                    alt={`${sibling.full_name}'s avatar`}
                                    width={200}
                                    height={200}
                                />
                            </div>

                            <div className="w-full py-4 border-b border-gray-200">
                                {/* Top row: Child name, animation, status */}
                                <div className="flex items-center justify-between mb-2">
                                    <h2 className="text-lg font-semibold text-gray-900 capitalize">
                                        {sibling.full_name}
                                    </h2>

                                    <div className="flex items-center gap-3">
                                        {(sibling.presence === "ON_THE_WAY" || sibling.status === "PICKED") && (
                                            <DotLottieReact
                                                src="/images/arriving.json"
                                                loop
                                                autoplay
                                                style={{ width: 50, height: 50 }}
                                            />
                                        )}
                                        <Badge
                                            variant="outline"
                                            className={`px-3 py-1 rounded-full text-xs font-medium tracking-wide ${sibling.status === "PICKED"
                                                    ? "bg-[crimson] text-white"
                                                    : "bg-teal-600 text-white"
                                                }`}
                                        >
                                            {sibling.status}
                                        </Badge>
                                    </div>
                                </div>

                                {/* Bus info */}
                                <p className="text-sm text-gray-500 capitalize">
                                    {bus?.color} {bus?.bus_product_name} {bus?.bus_number}
                                </p>

                                {/* Driver info */}
                                <div className="flex justify-between text-sm text-gray-700 mt-1">
                                    <span className="capitalize">{driver?.full_name}</span>
                                    <span className="font-medium">{driver?.phoneNumber}</span>
                                </div>

                                {/* Teacher info */}
                                <div className="flex justify-between text-sm text-gray-800 mt-1">
                                    <span className="capitalize">{teacher?.full_name}</span>
                                    <span className="font-medium">{teacher?.phoneNumber}</span>
                                </div>
                            </div>

                        </div>
                    );
                })}
            </section>

        </main>
    );
};

export default ParentViewData;
