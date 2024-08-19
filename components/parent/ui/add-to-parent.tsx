// "use client"

// import {
//     Select,
//     SelectContent,
//     SelectGroup,
//     SelectItem,
//     SelectLabel,
//     SelectTrigger,
//     SelectValue,
// } from "@/components/ui/select";
// import { addTeacher } from "@/actions/add-teacher";

// type SelectProps = {
//     placeholder: string;
//     label?: string;
//     data: dataProps[]
//     id: string
//     mode: string
// };

// type dataProps = {
//     id: string;
//     bus_product_name: string | null;
//     bus_number: string;
//     driver?: string | null;
//     teacher?: string | null;
// };



// export const AddToParent = ({ placeholder, label, data, id, mode }: SelectProps) => {
//     const [passenger, setPassenger] = useState<object>({ busId: undefined, studentId: undefined })


//     const handleSelectBus = (value: string) => {
//         const handleMode = mode === "driver" ? addDriver(id, value) : addTeacher(id, value)
//         startTransition(() => {
//             handleMode.then((data) => {
//                 toast({
//                     description: data.message,
//                 });
//                 // window.location.reload();
//             }).catch((error) => {
//                 console.error("Error:", error);
//                 toast({
//                     description: "An error occurred. Please try again.",
//                 });
//             });
//         })
//     }
//     return (
//         <Select onValueChange={handleSelectBus}>
//             <SelectTrigger className={` text-gray-200 `} >
//                 <SelectValue placeholder={placeholder} />
//             </SelectTrigger>
//             <SelectContent>
//                 <SelectGroup>
//                     <SelectLabel>{label}</SelectLabel>
//                     {
//                         data && data?.map((item: dataProps, index: number) => {

//                             // Render based on mode and if the bus is available
//                             const isDriverMode = mode === "driver" && !item.driver; //Only shows buses that do not have a driver assigned.
//                             const isTeacherMode = mode === "teacher" && !item.teacher; //Only shows buses that do not have a teacher assigned.

//                             return (
//                                 (isDriverMode || isTeacherMode) && (
//                                     <SelectItem key={item.id} value={item.id}>
//                                         <div className="space-x-1">
//                                             <span>
//                                                 {item.bus_product_name}
//                                             </span>
//                                             <span>
//                                                 ({item.bus_number})
//                                             </span>
//                                         </div>
//                                     </SelectItem>

//                                 )
//                             )
//                         })
//                     }
//                 </SelectGroup>
//             </SelectContent>
//         </Select>
//     );
// };

"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { StudentProps } from "@/types"
import { toast } from "@/components/ui/use-toast";
import { addDriver } from "@/actions/add-driver";
import { useEffect, useState, useTransition } from "react";
import { addParent } from "@/actions/add-parent"


type SelectProps = {
    placeholder: string;
    label?: string;
    data: dataProps[]
    id: string
    mode: string
};

type dataProps = {
    id: string;
    full_name: string | null;
    bus_number: string;
    driver?: string | null;
    teacher?: string | null;
};

export function AddStudents({ data }: StudentProps) {
    const [open, setOpen] = React.useState(false)
    const [value, setValue] = React.useState("")
    const [isPending, startTransition] = useTransition()


    const handleSelectBus = (value: string) => {
        startTransition(() => {
            addParent(, value).then((data) => {
                toast({
                    description: data.message,
                });
                // window.location.reload();
            }).catch((error) => {
                console.error("Error:", error);
                toast({
                    description: "An error occurred. Please try again.",
                });
            });
        })
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-[200px] justify-between bg-black hover:bg-[var--(bgSoft)] hover:text-gray-300 border-0"
                >
                    {value
                        ? data.find((parent: StudentProps) => parent.full_name === value)?.full_name
                        : "Select Parent..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0 ">
                <Command
                    className="bg-black hover:bg-[var--(bgSoft)] border-gray-950 "
                >
                    <CommandInput placeholder="Search Students..." />
                    <CommandList className="text-gray-200"

                    >
                        <CommandEmpty>No Student found.</CommandEmpty>
                        <CommandGroup
                        >
                            {data?.map((student: StudentProps) => (
                                <CommandItem
                                    key={student.id}
                                    value={JSON.stringify({ parentId: parent.id, studentId: student.id })}
                                    onSelect={(currentValue) => {
                                        setValue(currentValue === value ? "" : currentValue)
                                        setOpen(false)
                                    }}
                                    className="text-gray-200"

                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            value === student.id ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    {student.full_name}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover >
    )
}