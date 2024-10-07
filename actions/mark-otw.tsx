"use server"
import { StudentAttendance } from "@prisma/client";
import { db } from "@/lib/db";
import { revalidateTag } from "next/cache";

export const updateLocation = async (
    id: string,
    data: StudentAttendance
) => {
    try {
        if (!data) {
            return { message: "Invalid data provided", status: 400 };
        }
        await db.student.update({
            where: { id: id },
            data: {
                //@ts-ignore
                presence: data,
            },
            include: {
                parent: true,
                bus: true,
            },
        });
        revalidateTag("students");


    } catch (error) {
        console.error("Error updating attendance:", error);


        return {
            message: "Error updating attendance",
            error: error instanceof Error ? error.message : "Unknown error",
            status: 500,
        };
    }
}