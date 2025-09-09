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
import { Button } from "../ui/button";

type SelectProps = {
    placeholder: string;
    label?: string;
    handleSelectChange: (value: string) => void;
    setFilterGrade?: Dispatch<SetStateAction<string>>;
    data: any
    mode?: string
    edit?: string
};

export const SelectActiveTeacher = ({ placeholder, label, data, handleSelectChange, setFilterGrade, mode, edit }: SelectProps) => {
    const handleAll = () => {
        //@ts-ignore
        setFilterGrade("All")
    }

    return (
        <Select onValueChange={(val) => {
            const parsed = JSON.parse(val)
            handleSelectChange(parsed)
        }}>
            <SelectTrigger className="w-full text-gray-100 cursor-pointer">
                <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
                <SelectGroup>
                    <SelectLabel className="capitalize">{edit ? edit : label}</SelectLabel>
                    {data?.map((item: any, index: number) => (
                        <SelectItem
                            key={index}
                            value={JSON.stringify({ busId: item?.busId, teacherName: item?.full_name, teacherId: item?.id })}
                            className="cursor-pointer capitalize space-y-2"
                        >
                            {item.full_name}
                        </SelectItem>
                    ))}
                </SelectGroup>
                {mode !== "edit" &&
                    <Button onClick={handleAll} size={"lg"} className="bg-none w-full">All</Button>
                }
            </SelectContent>
        </Select>

    );
};

