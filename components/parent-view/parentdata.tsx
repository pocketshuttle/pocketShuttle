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

const fetcher = async (url: string) => {
    const res = await fetch(url);
    const data = await res.json();

    if (!res.ok) {
        throw new Error(data?.message || "Error fetching parent data");
    }

    return data;
};

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
            <div className="mx-auto flex max-w-lg items-center overflow-hidden rounded-lg border border-black/10 bg-white px-2">
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
        <main className="px-4 pb-6 text-black" >
            {/* <StudentNotificationBar /> */}
            {
                studentPresense?.map((studentBus) => (
                    <TeacherDetailsForParentPage key={studentBus.id} bus={studentBus?.bus} userId={userId} />
                ))
            }
            <h3 className="px-2 pb-4 pt-2 text-center text-xl font-semibold text-black">All kids</h3>
            <section className="space-y-3">
                {parentData?.Student?.length ? parentData.Student.map((sibling: StudentProps) => {
                    const { bus } = sibling;
                    const driver = bus?.driver;
                    const teacher = bus?.teacher;

                    // console.log(sibling, "sibling data in parent view");
                    return (
                        <div
                            key={sibling.id}
                            className="mx-auto mb-4 flex max-w-lg items-center gap-4 rounded-lg border border-black/10 bg-white p-4 text-black transition-all hover:bg-black/[0.02]"
                        >
                            {/* Image */}
                            <div className="relative w-20 h-20 flex-shrink-0">
                                <Image
                                    className="h-full w-full rounded-lg object-cover ring-1 ring-black/10"
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
                                    <h2 className="text-base font-semibold capitalize leading-tight text-black">
                                        {sibling.full_name || "Unnamed student"}
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
                                <p className="text-sm capitalize text-black/55">
                                    {bus ? `${bus.color || ""} ${bus.bus_product_name || ""} ${bus.bus_number || ""}` : "No bus assigned"}
                                </p>

                                {/* Driver Info */}
                                <div className="mt-2 flex justify-between gap-3 text-sm text-black/70">
                                    <span className="min-w-0 truncate capitalize">{driver?.full_name || "No driver"}</span>
                                    <span className="shrink-0 font-medium text-black">{driver?.phoneNumber || "N/A"}</span>
                                </div>

                                {/* Teacher Info */}
                                <div className="mt-1 flex justify-between gap-3 text-sm text-black/70">
                                    <span className="min-w-0 truncate capitalize">{teacher?.full_name || "No teacher"}</span>
                                    <span className="shrink-0 font-medium text-black">{teacher?.phoneNumber || "N/A"}</span>
                                </div>
                            </div>
                        </div>
                    );

                }) : (
                    <div className="mx-auto max-w-lg rounded-lg border border-black/10 bg-white p-5 text-center text-sm text-black/55">
                        No kids linked to this parent yet.
                    </div>
                )}
            </section>

        </main>
    );
};

export default ParentViewData;
