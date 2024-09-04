import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";

import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { StudentProps } from "@/types";
import { toast } from "@/components/ui/use-toast";
import { addParent } from "@/actions/add-parent";
import { useState, useTransition } from "react";
import { ConfirmationModal } from "./confirmation-modal";
import { confirmParent } from "@/actions/confirm-parent";
import Image from "next/image";

export function AddStudents({ data, parentId }: { data: StudentProps[], parentId: string }) {
    const [open, setOpen] = useState(false);
    const [value, setValue] = useState("");
    const [searchTerm, setSearchTerm] = useState(""); // State for the search term
    const [isPending, startTransition] = useTransition();
    const [openModal, setIsOpenModal] = useState(false)

    const handleSelectStudent = (value: string) => {
        startTransition(() => {
            addParent(value, parentId).then((response) => {
                if (response.status === 100) {
                    setIsOpenModal(true)
                }
                toast({
                    description: response.message,
                });
                setValue(value);
            }).catch((error) => {
                console.error("Error:", error);
                toast({
                    description: "An error occurred. Please try again.",
                });
            });
        });
    };

    const handleConfirmation = (confirm: string) => {
        startTransition(() => {
            confirmParent(value, parentId, confirm).then((response) => {
                toast({
                    description: response.message,
                });
                setIsOpenModal(false)
                setValue(value);
            }).catch((error) => {
                console.error("Error:", error);
                toast({
                    description: "An error occurred. Please try again.",
                });
            });
        });
    }

    const handleCancel = () => {
        setIsOpenModal(false)
        setOpen(false)
    }

    // Filter students based on the search term
    const filteredData = data?.filter(student =>
        student.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-[200px] justify-between bg-black hover:bg-[var--(bgSoft)] hover:text-gray-300 border-0"
                    disabled={isPending} // Disable button while pending
                >
                    {value
                        ? data.find((student: StudentProps) => student.id === value)?.full_name
                        : "Select Parent..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            {openModal && <ConfirmationModal
                handleYes={handleConfirmation} isPending={isPending} handleCancel={handleCancel} />}

            <PopoverContent className="w-[200px] p-0">
                <Command className="bg-black hover:bg-[var--(bgSoft)] border-gray-950">
                    <CommandInput
                        placeholder="Search Students..."
                        onValueChange={(value) => setSearchTerm(value)} // Update search term
                    />
                    <CommandList className="text-gray-200">
                        <CommandEmpty>No Student found.</CommandEmpty>
                        <CommandGroup>
                            {filteredData?.map((student: StudentProps) => (
                                <CommandItem
                                    key={student.id}
                                    value={student.id}
                                    onSelect={() => {
                                        setValue(student.id);
                                        setOpen(false);
                                        handleSelectStudent(student.id);
                                    }}
                                    className="text-gray-200"
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            value === student.id ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    <div className="flex space-x-1 ">
                                        <Image src={student.image} width={40} height={50} alt="avatar" className="rounded-md" />
                                        <span className="text-sm capitalize">{student.full_name}</span>
                                    </div>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
