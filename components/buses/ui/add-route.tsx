"use client"
import { useEffect, useState, useTransition } from "react";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { addRoute } from "@/actions/add-route";

type SelectProps = {
    placeholder: string;
    label?: string;
    data: dataProps[]
    busId: string
};

type dataProps = {
    _id: string
    route_name: string | null
    route_description: string
}



export const AddRoute = ({ placeholder, label, data, busId }: SelectProps) => {
    const [isPending, startTransition] = useTransition()
    console.log("routes", data)

    const handleSelectRoute = (value: string) => {

        startTransition(() => {
            addRoute(busId, value).then((data) => {
                toast({
                    description: data.message,
                });
                window.location.reload();
            }).catch((error) => {
                console.error("Error:", error);
                toast({
                    description: "An error occurred. Please try again.",
                });
            });
        })
    }


    return (
        <Select onValueChange={handleSelectRoute} >
            <SelectTrigger className={` text-gray-200 `} >
                <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
                <SelectGroup>
                    <SelectLabel>{label}</SelectLabel>
                    {
                        data && data?.map((item: dataProps, index: number) => (
                            <SelectItem key={item._id} value={item._id}>
                                <div className="space-x-1">
                                    <span>
                                        {item.route_name},
                                    </span>
                                    <span className="text-[0.65rem]">
                                        {item.route_description}
                                    </span>
                                </div>
                            </SelectItem>
                        ))
                    }
                </SelectGroup>
            </SelectContent>
        </Select>
    );
};

