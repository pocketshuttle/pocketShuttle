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
    placeholder: string;
    label?: string;
    handleSelectChange: (value: string) => void;
    setFilterGrade: Dispatch<SetStateAction<string>>;
    data: any
};
const data = [
    {
        value: "parent",
        label: "Parent",
    },
    {
        value: "teacher",
        label: "Teacher",
    },
];
export const AddRoles = ({ handleSelectChange }: SelectProps) => {

    return (
        <Select onValueChange={handleSelectChange}>
            <SelectTrigger className="w-3/6 text-gray-100">
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

