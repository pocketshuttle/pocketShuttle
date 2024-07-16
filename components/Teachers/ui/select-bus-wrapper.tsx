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

type dataProps = {
    _id: string
    bus_product_name: string
}

export const SelectBusWrapper = ({ placeholder, label, data, handleSelectChange }: SelectProps) => {
    return (
        <Select onValueChange={handleSelectChange}>
            <SelectTrigger className="w-3/6">
                <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
                <SelectGroup>
                    <SelectLabel>{label}</SelectLabel>
                    {
                        data && data?.map((item: dataProps, index: number) => (
                            <SelectItem key={index} value={item._id}>{item.bus_product_name}</SelectItem>
                        ))
                    }
                </SelectGroup>
            </SelectContent>
        </Select>
    );
};

