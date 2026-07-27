import { Prisma } from "@prisma/client";

import db from "@/packages/db/client";

export type StudentUpdateClient = {
  updateMany(args: {
    where: Prisma.StudentWhereInput;
    data: Prisma.StudentUpdateManyMutationInput;
  }): Promise<{ count: number }>;
};

export async function resetStudentDailyState(
  students: StudentUpdateClient = db.student
) {
  return students.updateMany({
    where: { presence: { not: "NONE" } },
    data: {
      presence: "NONE",
      status: "DROPPED",
      attendance: "ABSENT",
    },
  });
}

export async function moveInBusStudentsToSchool(
  students: StudentUpdateClient = db.student
) {
  return students.updateMany({
    where: { presence: "IN_BUS" },
    data: { presence: "AT_SCHOOL" },
  });
}
