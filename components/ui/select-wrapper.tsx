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
    setFilterGrade?: Dispatch<SetStateAction<string>>;
    data: any
    mode?: string
    edit?: string
};

export const SelectProperty = ({ placeholder, label, data, handleSelectChange, setFilterGrade, mode, edit }: SelectProps) => {
    const handleAll = () => {
        //@ts-ignore
        setFilterGrade("All")
    }
    return (
        <Select onValueChange={handleSelectChange}>
            <SelectTrigger className="w-full text-gray-100 bg-[#1d146d]">
                <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
                <SelectGroup>
                    <SelectLabel>{edit ? edit : label}</SelectLabel>
                    {
                        data?.map((item: any, index: number) => (
                            <SelectItem key={index} value={item.label}>{item.value}</SelectItem>
                        ))
                    }
                </SelectGroup>
                {
                    mode !== "edit" &&
                    <Button onClick={handleAll} size={"lg"} className="bg-none w-full">All</Button>
                }
            </SelectContent>

        </Select>
    );
};

