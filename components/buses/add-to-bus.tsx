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

type SelectProps = {
    placeholder: string;
    label?: string;
    data: dataProps[]
    id: string
};

type dataProps = {
    _id: string
    bus_product_name: string | null
    bus_number: string
    classname?: string
}



export const AddToBus = ({ placeholder, label, data, id }: SelectProps) => {
    const [passenger, setPassenger] = useState<object>({ busId: undefined, studentId: undefined })
    const [isPending, startTransition] = useTransition()


    const handleSelectBus = (value: string) => {
        console.log("bus id", value)
        startTransition(() => {
            addTeacher(id, value).then((data) => {
                toast({
                    description: data.message,
                });
            })
        })
    }


    return (
        <Select onValueChange={handleSelectBus}>
            <SelectTrigger className={` text-gray-200`}>
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

