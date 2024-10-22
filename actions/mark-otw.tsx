"use server";
import { StudentAttendance, StudentPresence } from "@prisma/client"; // Import StudentPresence
import { db } from "@/lib/db";
import { revalidateTag } from "next/cache";



export const updateLocation = async (
    id: string,
    data: StudentPresence
) => {
    console.log("Updating presence with data:", data);

    try {
        // Ensure valid data is provided
        if (!data) {
            return { message: "Invalid data mapping", status: 400 };
        }

        // Update the student's presence field in the database
        const updatedStudent = await db.student.update({
            where: { id: id },
            data: {
                presence: data, 
            },
            include: {
                parent: true,
                bus: true,
            },
        });

        // Revalidate the tag to update cached data
        revalidateTag("students");

        // Return success response with updated data
        return {
            message: "Presence updated successfully",
            student: updatedStudent,
            status: 200,
        };

    } catch (error) {
        // Log the error for debugging
        console.error("Error updating presence:", error);

        return {
            message: "Error updating presence",
            error: error instanceof Error ? error.message : "Unknown error",
            status: 500,
        };
    }
};
