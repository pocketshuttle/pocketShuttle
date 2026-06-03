import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Dispatch, SetStateAction } from "react";

type SelectProps = {
    placeholder?: string;
    label?: string;
    handleSelectChange: (value: string) => void;
    setFilterGrade?: Dispatch<SetStateAction<string>>;
    data: any
    value?: string;
};

export const AddRoles = ({ handleSelectChange, data, value }: SelectProps) => {

    return (
        <Select value={value} onValueChange={handleSelectChange}>
            <SelectTrigger className="h-11 w-full rounded-lg border-[#4a48ff]/30 bg-[#11192a] text-[#dce1ff] shadow-none hover:bg-[#172039] focus:ring-1 focus:ring-[#6d72c9] sm:w-[148px]">
                <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent className="rounded-lg border-[#4a48ff]/30 bg-[#11192a] text-white">
                <SelectGroup>
                    {
                        data?.map((item: any, index: number) => (
                            <SelectItem key={index} value={item.value} className="h-10 rounded-md focus:bg-[#4a48ff] focus:text-white">{item.label}</SelectItem>
                        ))
                    }
                </SelectGroup>
            </SelectContent>

        </Select>
    );
};
