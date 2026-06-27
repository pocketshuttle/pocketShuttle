"use client";
import { importStudents } from "@/actions/batch-upload/batch-upload";
import { toast } from "@/components/ui/use-toast";
import { useState } from "react";

export const ImportStudentsForm = ({ schoolId }: { schoolId: string }) => {
    const [msg, setMsg] = useState("")

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()

        const formData = new FormData(e.currentTarget)
        formData.append("schoolId", schoolId)


        const res = await importStudents(formData)
        if (res.success) {
            toast({
                description: `Imported ${res.count} students`,
            })
        } else {
            toast({
                description: `${res.errors?.join(", ")}`
            });
        }
    }

    return (
        <form onSubmit={handleSubmit} className="p-2 border-[0.5px] rounded-lg">
            <input type="file" name="file" accept=".csv,text/csv" required />
            <button type="submit" className="ml-2 px-4 py-2 bg-blue-600 text-white rounded">
                Import
            </button>
        </form>
    );
}
