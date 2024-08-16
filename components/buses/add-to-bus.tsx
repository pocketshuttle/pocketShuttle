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
import useUpdateAttendance from "@/hooks/usePatch";
import { addTeacher } from "@/actions/add-teacher";
import { toast } from "@/components/ui/use-toast";
import { addDriver } from "@/actions/add-driver";

type SelectProps = {
    placeholder: string;
    label?: string;
    data: dataProps[]
    id: string
    mode: string
};

type dataProps = {
    id: string
    bus_product_name: string | null
    bus_number: string
    classname?: string
}



export const AddToBus = ({ placeholder, label, data, id, mode }: SelectProps) => {
    const [passenger, setPassenger] = useState<object>({ busId: undefined, studentId: undefined })
    const [isPending, startTransition] = useTransition()
    console.log(id)

    const handleSelectBus = (value: string) => {
        const handleMode = mode === "driver" ? addDriver(id, value) : addTeacher(id, value)
        startTransition(() => {
            handleMode.then((data) => {
                toast({
                    description: data.message,
                });
                // window.location.reload();
            }).catch((error) => {
                console.error("Error:", error);
                toast({
                    description: "An error occurred. Please try again.",
                });
            });
        })
    }


    return (
        <Select onValueChange={handleSelectBus}>
            <SelectTrigger className={` text-gray-200 `} >
                <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
                <SelectGroup>
                    <SelectLabel>{label}</SelectLabel>
                    {
                        data && data?.map((item: dataProps, index: number) => (
                            <SelectItem key={item.id} value={item.id}>
                                <div className="space-x-1">
                                    <span>
                                        {item.bus_product_name}
                                    </span>
                                    <span>
                                        ({item.bus_number})
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

