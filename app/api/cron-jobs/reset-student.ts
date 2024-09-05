import { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";

// Instantiate Prisma Client
const db = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Fetch all students that need to be updated
    const students = await db.student.findMany({
      where: {
        presence: {
          not: "NONE",
        },
      },
    });

    // Update each student
    for (const student of students) {
      await db.student.update({
        where: { id: student.id },
        data: {
          presence: "NONE",
          status: "DROPPED",
          attendance: "ABSENT",
        },
      });
    }

    res.status(200).json({ message: "Scheduled task completed successfully." });
  } catch (error) {
    console.error("Error during scheduled task:", error);
    res.status(500).json({ error: "Failed to update students" });
  } finally {
    // Disconnect the Prisma client
    await db.$disconnect();
  }
}
