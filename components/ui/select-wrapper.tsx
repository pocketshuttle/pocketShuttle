import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "./button";
import { Dispatch, SetStateAction } from "react";

type SelectProps = {
    placeholder: string;
    label?: string;
    handleSelectChange: (value: string) => void;
    setFilterGrade: Dispatch<SetStateAction<string>>
    data: any
};

export const SelectProperty = ({ placeholder, label, data, handleSelectChange, setFilterGrade }: SelectProps) => {
    const handleAll = () => {
        setFilterGrade("All")
    }
    return (
        <Select onValueChange={handleSelectChange}>
            <SelectTrigger className="w-3/6 text-gray-100">
                <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
                <SelectGroup>
                    <SelectLabel>{label}</SelectLabel>
                    {
                        data?.map((item: any, index: number) => (
                            <SelectItem key={index} value={item.label}>{item.value}</SelectItem>
                        ))
                    }
                </SelectGroup>
                <Button onClick={handleAll} size={"lg"} className="bg-none w-full">All</Button>
            </SelectContent>

        </Select>
    );
};

