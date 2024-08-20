const { PrismaClient } = require('@prisma/client');

// Instantiate Prisma Client
const db = new PrismaClient();

const updateStudentsStatus = async () => {
  try {
    // Fetch all students that need to be updated
    const students = await db.student.findMany({
      where: {
        status: "DROPPED",
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

    console.log("Scheduled task completed successfully.");
  } catch (error) {
    console.error("Error during scheduled task:", error);
  } finally {
    // Ensure Prisma Client disconnects
    await db.$disconnect();
  }
};

// Execute the function
updateStudentsStatus();
