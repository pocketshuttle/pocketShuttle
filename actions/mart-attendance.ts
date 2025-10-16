"use server";

import { revalidateTag } from "next/cache";
import db, { StudentAttendance } from "@/packages/db/client";
// import { StudentAttendance } from "@prisma/client";
import { Knock } from "@knocklabs/node";
import { sendNotification } from "./send-notifications";
import { sendSms } from "./notification/send-sms";
import { broadcastAttendanceUpdate } from "@/app/api/events/attendance-events";
import { getUserSession } from "@/lib/session";

export const updateStudentAttendance = async (
  id: string,
  data: StudentAttendance
) => {
  const user = await getUserSession();
  if (!user || !["teacher", "admin", "ADMIN"].includes(user.role as string)) {
    return { message: "Unauthorized", status: 401 };
  }
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
    revalidateTag("new-parent");
    revalidateTag("students");

    if (!updatedStudent) {
      return { message: "Student not found", status: 404 };
    }
    // Send SMS notification
    // const smsResult = await sendSms({
    //   fullname: updatedStudent.full_name || "",
    //   parent_name: updatedStudent.parent?.full_name || "Parent",
    //   bus: updatedStudent.bus?.bus_product_name || "Unknown bus",
    //   message: data,
    //   phoneNumber: updatedStudent.parent?.phoneNumber || "",
    // });

    // if (smsResult.status !== 200) {
    //   console.error("Failed to send SMS:", smsResult.message);
    // }

    // const handlePushNotification = async () => {
    //   if (updatedStudent) {
    //     await sendNotification(
    //       `marked as ${data}`,
    //       updatedStudent.parentId!,
    //       updatedStudent?.image!,
    //       updatedStudent?.full_name!
    //     );
    //   }
    // };

    // handlePushNotification();

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
    revalidateTag("new-parent");

    // Notify connected clients with the attendance update
    broadcastAttendanceUpdate({
      id: updatedStudent.id,
      fullName: updatedStudent.full_name,
      attendance: data,
      bus: updatedStudent.bus?.bus_product_name || "bus",
    });

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
