"use client"
import { useEffect, useState } from "react";
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

type SelectProps = {
    placeholder: string;
    label?: string;
    data: dataProps[]
    studentId: string
};

type dataProps = {
    _id: string
    bus_product_name: string | null
    bus_number: string
    classname?: string
}



export const SelectPassengerBus = ({ placeholder, label, data, studentId }: SelectProps) => {
    const [passenger, setPassenger] = useState<object>({ busId: undefined, studentId: undefined })

    const { updateAtendance, loading, error } = useUpdateAttendance(studentId, "PATCH");

    const handleSelectBus = (value: string | object) => {
        updateAtendance({ busId: value, studentId: studentId }, `/api/addbus/addstudent/${studentId}`)
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

