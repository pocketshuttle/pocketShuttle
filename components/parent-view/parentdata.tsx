"use client";

import { ParentProps, StudentProps } from "@/types";
import Image from "next/image";
import avatar from "@/public/images/avatar.jpg";
import { Badge } from "@/components/ui/badge";
import useSWR from "swr";
import { FormError } from "../errorsandsuccess/form-error";
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

import { StudentNotificationBar } from "./notification-bar";
import { TeacherDetailsForParentPage } from "./teacher-details";
import home from "@/public/images/home.svg";
import inbus from "@/public/images/inbus.svg";
import classimage from "@/public/images/classimage.svg";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

//we only show the teacher details when the student has OTW marked

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
                <div className="flex items-center gap-2 m-auto">
                    <DotLottieReact
                        src="/images/parentload.json"
                        loop
                        autoplay
                        style={{ width: 400, height: 400 }}
                    />
                </div>
            </div>
        );
    }

    const studentPresense = parentData?.Student?.filter((student: StudentProps) => (
        student.presence === "ON_THE_WAY"
    ))

    return (
        <main className=" " >
            {/* <StudentNotificationBar /> */}
            {
                studentPresense?.map((studentBus) => (
                    <TeacherDetailsForParentPage bus={studentBus?.bus} userId={userId} />
                ))
            }
            <h3 className="text-center text-gray-950 font-medium text-xl rounded-tl-lg p-5 ">All kids</h3>
            <section className="bg-white rounded-t-xl space-y-3">
                {parentData?.Student?.map((sibling: StudentProps) => {
                    const { bus } = sibling;
                    const driver = bus?.driver;
                    const teacher = bus?.teacher;

                    // console.log(sibling, "sibling data in parent view");
                    return (
                        <div
                            key={sibling.id}
                            className="max-w-lg mx-auto flex items-center gap-4 bg-white p-4 rounded-2xl shadow-sm hover:shadow-md transition-all border border-gray-100 mb-4"
                        >
                            {/* Image */}
                            <div className="relative w-20 h-20 flex-shrink-0">
                                <Image
                                    className="w-full h-full object-cover rounded-xl"
                                    src={sibling.image || avatar}
                                    alt={`${sibling.full_name}'s avatar`}
                                    width={80}
                                    height={80}
                                />
                            </div>

                            {/* Info Section */}
                            <div className="flex-1">
                                {/* Name and Status */}
                                <div className="flex items-center justify-between mb-2">
                                    <h2 className="text-base font-semibold text-gray-900 capitalize leading-tight">
                                        {sibling.full_name}
                                    </h2>

                                    <div className="flex items-center gap-1">
                                        {sibling.presence === "ON_THE_WAY" ? (
                                            <DotLottieReact
                                                src="/images/arriving.json"
                                                loop
                                                autoplay
                                                style={{ width: 36, height: 36 }}
                                            />
                                        ) : sibling.presence === "AT_SCHOOL" ? (
                                            <Image
                                                className="w-8 h-8 rounded-md"
                                                src={classimage}
                                                alt="At school"
                                                width={32}
                                                height={32}
                                            />
                                        ) : sibling.presence === "IN_BUS" ? (
                                            <Image
                                                className="w-8 h-8 rounded-md"
                                                src={inbus}
                                                alt="In bus"
                                                width={32}
                                                height={32}
                                            />
                                        ) : sibling.presence === "NONE" ? (
                                            <Image
                                                className="w-8 h-8 rounded-md"
                                                src={home}
                                                alt="At home"
                                                width={32}
                                                height={32}
                                            />
                                        ) : null}
                                    </div>
                                </div>

                                {/* Bus Info */}
                                <p className="text-sm text-gray-500 capitalize">
                                    {bus?.color} {bus?.bus_product_name} {bus?.bus_number}
                                </p>

                                {/* Driver Info */}
                                <div className="flex justify-between text-sm text-gray-700 mt-2">
                                    <span className="capitalize">{driver?.full_name}</span>
                                    <span className="font-medium text-gray-900">{driver?.phoneNumber}</span>
                                </div>

                                {/* Teacher Info */}
                                <div className="flex justify-between text-sm text-gray-700 mt-1">
                                    <span className="capitalize">{teacher?.full_name}</span>
                                    <span className="font-medium text-gray-900">{teacher?.phoneNumber}</span>
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
