const { PrismaClient } = require("@prisma/client");
const cron = require("node-cron");

// Instantiate Prisma Client
const db = new PrismaClient();

// Define the function to update student status
const updateStudentsStatus = async () => {
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

    console.log("Scheduled task completed successfully.");
  } catch (error) {
    console.error("Error during scheduled task:", error);
  } finally {
    // Ensure Prisma Client disconnects
    await db.$disconnect();
  }
};

// Schedule the task to run daily at midnight
// cron.schedule("0 0 * * *", () => {
//   console.log("Running scheduled task...");
//   updateStudentsStatus();
// });
cron.schedule("50 2 * * *", () => {
  console.log("Running scheduled task at 2:45 AM...");
  updateStudentsStatus();
});
