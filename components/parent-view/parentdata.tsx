"use client";

import { ParentProps, StudentProps } from "@/types";
import Image from "next/image";
import avatar from "@/public/images/avatar.jpg";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import useSWR from "swr";
import { FormError } from "../errorsandsuccess/form-error";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const ParentViewData = ({ userId }: { userId: string }) => {
    const { data: parentData, error, isLoading } = useSWR<ParentProps>(
        `/api/addparent/${userId}`,
        fetcher
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

                return (
                    <div
                        key={sibling.id}
                        className="max-w-lg mx-auto bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 flex items-center px-2 mb-4"
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

                        <div className="p-4">
                            <div className="flex items-center space-x-4">
                                <h2 className="text-xl font-semibold text-gray-900">
                                    {sibling.full_name}
                                </h2>
                                <Badge
                                    variant="outline"
                                    className={`text-[#EEEEEE] text-[0.5rem] ${sibling.status === "PICKED" ? "bg-[crimson]" : "bg-[teal]"
                                        }`}
                                >
                                    {sibling.status}
                                </Badge>
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
