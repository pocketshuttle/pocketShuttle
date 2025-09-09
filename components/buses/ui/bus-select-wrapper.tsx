import { useState } from "react";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

type SelectProps = {
    placeholder: string;
    label?: string;
    handleSelectChange: (value: string) => void;
    data: any
};

export const BusSelectWrapper = ({ placeholder, label, data, handleSelectChange }: SelectProps) => {
    return (
        <Select onValueChange={handleSelectChange}>
            <SelectTrigger className="w-3/6 text-blue-100 bg-[#1d146d]">
                <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
                <SelectGroup>
                    <SelectLabel>{label}</SelectLabel>
                    {
                        data?.map((item: any, index: number) => (
                            <SelectItem key={index} value={item.id}>{item.route_name}</SelectItem>
                        ))
                    }
                </SelectGroup>
            </SelectContent>
        </Select>
    );
};

