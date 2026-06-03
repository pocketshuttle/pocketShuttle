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
import { toast } from "@/components/ui/use-toast";
import { addParent } from "@/actions/add-parent";
import { useState, useTransition } from "react";
import { ConfirmationModal } from "./confirmation-modal";
import { confirmParent } from "@/actions/confirm-parent";
import Image from "next/image";
import { useDebounce } from "@/hooks/use-debounce";

type StudentOption = {
    id: string;
    full_name?: string | null;
    image?: string | null;
};

export function AddStudents({ data, parentId }: { data: StudentOption[], parentId: string }) {
    const [open, setOpen] = useState(false);
    const [value, setValue] = useState("");
    const [searchTerm, setSearchTerm] = useState(""); // State for the search term
    const [isPending, startTransition] = useTransition();
    const [openModal, setIsOpenModal] = useState(false)
    const debouncedSearchTerm = useDebounce(searchTerm, 300);
    // console.log("Students Data:", data);

    const handleSelectStudent = (value: string) => {
        startTransition(async () => {
            const res = addParent(value, parentId)
                .then((response) => {
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
    const filteredData = React.useMemo(() => {
        if (!data || !Array.isArray(data)) return [];
        if (!debouncedSearchTerm.trim()) return data; // If search term is empty, return all data

        const searchQuery = debouncedSearchTerm.trim().toLowerCase();

        return data.filter(student => {
            if (!student.full_name) return false; // Skip if full_name is undefined
            // Convert full_name to lowercase and check if it includes the search term
            const studentName = student.full_name?.toLowerCase();
            const isMatch = studentName.normalize().includes(searchQuery.normalize());

            // Debug logging
            console.log({
                searchQuery,
                studentName,
                isMatch
            });

            return isMatch;
        })
    }, [data, debouncedSearchTerm])


    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="h-9 w-[170px] justify-between rounded-xl border-0 bg-black/5 px-3 text-sm font-medium text-black shadow-none hover:bg-black/10 dark:bg-white/10 dark:text-white dark:hover:bg-white/15"
                    disabled={isPending}
                >
                    {value
                        ? data.find((student: StudentOption) => student.id === value)?.full_name
                        : "Select Student..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            {openModal && <ConfirmationModal
                handleYes={handleConfirmation} isPending={isPending} handleCancel={handleCancel} />}

            <PopoverContent className="w-[220px] border-0 bg-white p-0 text-black shadow-lg dark:bg-black dark:text-white">
                <Command className="border-0 bg-white text-black dark:bg-black dark:text-white"
                    shouldFilter={false}
                >
                <CommandInput
                        placeholder="Search Students..."
                        onValueChange={(value) => setSearchTerm(value)}
                        className="text-black dark:text-white"
                    />
                    <CommandList className="text-black dark:text-white">
                        {filteredData.length === 0 ? (
                            <CommandEmpty>No Student found.</CommandEmpty>
                        ) : (
                            <CommandGroup>
                                {filteredData.map((student: StudentOption) => (
                                    <CommandItem
                                        key={student.id}
                                        value={student.id}
                                        onSelect={() => {
                                            setValue(student.id);
                                            setOpen(false);
                                            handleSelectStudent(student.id);
                                        }}
                                        className="text-black dark:text-white"
                                    >
                                        <Check
                                            className={cn(
                                                "mr-2 h-4 w-4",
                                                value === student.id ? "opacity-100" : "opacity-0"
                                            )}
                                        />
                                        <div className="flex space-x-1">
                                            <Image
                                                src={student.image || "/images/no-avatar.webp"}
                                                width={30}
                                                height={40}
                                                alt="avatar"
                                                className="rounded-md"
                                            />
                                            <span className="text-sm capitalize">
                                                {student.full_name || "Unnamed student"}
                                            </span>
                                        </div>
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        )}
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
