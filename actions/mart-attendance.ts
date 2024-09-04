"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { db } from "@/lib/db";
import { StudentAttendance } from "@prisma/client";
import { Knock } from "@knocklabs/node";
import { sendNotification } from "./send-notifications";

type ParamsProps = {
  id: string;
};

export const updateStudentAttendance = async (
  id: string,
  data: StudentAttendance
) => {
  const knock = new Knock(process.env.KNOCK_SECRET_API_SECRET);

  try {
    if (!data) {
      return { message: "Invalid data provided", status: 400 };
    }

    const updatedStudent = await db.student.update({
      where: { id: id },
      data: {
        attendance: data,
      },
      include: {
        parent: true,
        bus: true,
      },
    });

    // console.log(updatedStudent);
    if (!updatedStudent) {
      return { message: "Student not found", status: 404 };
    }
    const handlePushNotification = async () => {
      if (updatedStudent) {
        await sendNotification(
          `marked as ${data}`,
          updatedStudent.parentId!,
          updatedStudent?.image!,
          updatedStudent?.full_name!
        );
      }
    };

    handlePushNotification();

   

    revalidateTag("students");

    // await knock.workflows.trigger("in-bus", {
    //   data: {
    //     student_name: updatedStudent?.full_name,
    //     bus_color: updatedStudent?.bus?.color,
    //     bus_name: updatedStudent?.bus?.bus_product_name,
    //     bus_number: updatedStudent?.bus?.bus_number,
    //   },
    //   recipients: [
    //     {
    //       id: updatedStudent?.parent?.id!,
    //       name: updatedStudent?.parent?.full_name!,
    //       email: "abusomwansantos@gmail.com",
    //     },
    //   ],
    // });

    return {
      message: "Attendance updated successfully",
      student: updatedStudent,
      status: 200,
    };
  } catch (error) {
    console.error("Error updating attendance:", error);

    return {
      message: "Error updating attendance",
      error: error instanceof Error ? error.message : "Unknown error",
      status: 500,
    };
  }
};
