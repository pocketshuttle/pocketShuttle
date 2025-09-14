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
};

export const AddRoles = ({ handleSelectChange, data }: SelectProps) => {

    return (
        <Select onValueChange={handleSelectChange}>
            <SelectTrigger className="w-full text-white bg-[#1d146d] hover:bg-[#1d146d]/90">
                <SelectValue placeholder="Select Roles" />
            </SelectTrigger>
            <SelectContent>
                <SelectGroup>
                    {
                        data?.map((item: any, index: number) => (
                            <SelectItem key={index} value={item.value} className="h-9">{item.label}</SelectItem>
                        ))
                    }
                </SelectGroup>
            </SelectContent>

        </Select>
    );
};

