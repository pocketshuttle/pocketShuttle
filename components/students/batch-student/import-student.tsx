"use client";
import { importStudents } from "@/actions/batch-upload/batch-upload";
import { useState } from "react";

export const ImportStudentsForm = ({ schoolId }: { schoolId: string }) => {
    const [msg, setMsg] = useState("")

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()

        const formData = new FormData(e.currentTarget)
        formData.append("schoolId", schoolId)

        const res = await importStudents(formData)
        setMsg(res.success ? `✅ Imported ${res.count} students` : `❌ ${res.errors?.join(", ")}`);
    }

    return (
        <form onSubmit={handleSubmit} className="p-4 border rounded-lg">
            <input type="file" name="file" accept=".csv,.xlsx,.xls" required />
            <button type="submit" className="ml-2 px-4 py-2 bg-blue-600 text-white rounded">
                Import
            </button>
            {msg && <p className="mt-2">{msg}</p>}
        </form>
    );
}