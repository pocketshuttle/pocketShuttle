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
const fetcher = (url: string) => fetch(url).then((res) => res.json());

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

    return (
        <main>
            <h3 className="text-center p-5">All kids</h3>
            {parentData?.Student?.map((sibling: StudentProps) => {
                const { bus } = sibling;
                const driver = bus?.driver;
                const teacher = bus?.teacher;

                console.log("Sibling data:", sibling);

                return (
                    <div
                        key={sibling.id}
                        className="max-w-lg mx-auto space-x-2 bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 flex items-center px-2 mb-4"
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

                        <div className="py-4  w-full">
                            <div className="flex items-center space-x-4  w-full">
                                <div className=" w-8/12 ">
                                    <h2 className="text-xl font-semibold text-gray-900 capitalize">
                                        {sibling.full_name}
                                    </h2>
                                </div>
                                {/* this will not display if the child has been picked up */}
                                <div className="w-2/12 flex justify-start ">
                                    {
                                        sibling.presence === "ON_THE_WAY" &&
                                        <DotLottieReact
                                            src={"/images/arriving.json"}
                                            loop
                                            autoplay
                                            style={{ width: '80px', height: '80px', padding: '0px' }}
                                        />
                                    }
                                </div>


                                <div className="w-2/12 flex items-center justify-end space-x-2">
                                    <Badge
                                        variant="outline"
                                        className={`text-[#EEEEEE] text-[0.5rem] ${sibling.status === "PICKED" ? "bg-[crimson]" : "bg-[teal]"
                                            }`}
                                    >
                                        {sibling.status}
                                    </Badge>
                                </div>



                            </div>
                            <p className="capitalize text-gray-500">
                                {bus?.color} {bus?.bus_product_name} {bus?.bus_number}
                            </p>
                            <p className="space-x-2 capitalize text-gray-600">
                                <small>{driver?.full_name}</small>
                                <small className="ml-2 text-lg">{driver?.phoneNumber}</small>
                            </p>
                            <p className="space-x-2 capitalize text-gray-800">
                                <small>{teacher?.full_name}</small>
                                <small className="ml-2 text-lg">{teacher?.phoneNumber}</small>
                            </p>
                        </div>
                    </div>
                );
            })}
        </main>
    );
};

export default ParentViewData;
