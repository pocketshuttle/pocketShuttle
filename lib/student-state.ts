import "server-only";

import { revalidateTag } from "next/cache";

import db, {
  Prisma,
  StudentAttendance,
  StudentPresence,
  StudentStatus,
} from "@/packages/db/client";

const DEFAULT_TIMEZONE = "Africa/Lagos";
const STATE_TAGS = ["students", "parent", "new-parent", "teacher", "collection"] as const;

const studentStateInclude = {
  parent: true,
  bus: {
    select: {
      id: true,
      bus_product_name: true,
      teacher: {
        select: {
          id: true,
        },
      },
    },
  },
} satisfies Prisma.StudentInclude;

type StudentStateRecord = Prisma.StudentGetPayload<{
  include: typeof studentStateInclude;
}>;

type StudentScope = {
  studentId: string;
  schoolId?: string | null;
};

type StudentUpdateResult = {
  changed: boolean;
  hours: number;
  student: StudentStateRecord;
};

function getStudentWhere({ studentId, schoolId }: StudentScope) {
  return schoolId ? { id: studentId, schoolId } : { id: studentId };
}

async function getStudentState(scope: StudentScope) {
  return db.student.findFirst({
    where: getStudentWhere(scope),
    include: studentStateInclude,
  });
}

function getCurrentHourInTimeZone(timezone = DEFAULT_TIMEZONE) {
  const date = new Date();
  const zonedDate = new Date(date.toLocaleString("en-US", { timeZone: timezone }));
  return zonedDate.getHours();
}

function getSeatDelta(
  previousStatus: StudentStatus | null,
  nextStatus: StudentStatus | null
) {
  if (previousStatus !== "PICKED" && nextStatus === "PICKED") {
    return -1;
  }

  if (previousStatus === "PICKED" && nextStatus !== "PICKED") {
    return 1;
  }

  return 0;
}

async function updateBusSeats(tx: any, busId: string, delta: number) {
  if (!delta) {
    return;
  }

  await tx.buses.update({
    where: { id: busId },
    data: {
      seat_number: delta > 0 ? { increment: delta } : { decrement: Math.abs(delta) },
    },
  });
}

function getPresenceFromStatus(status: StudentStatus, hours: number): StudentPresence {
  if (status === "DROPPED") {
    return "NONE";
  }

  if (hours >= 9 && hours < 15) {
    return "AT_SCHOOL";
  }

  return "IN_BUS";
}

function revalidateStudentState() {
  for (const tag of STATE_TAGS) {
    revalidateTag(tag);
  }
}

export async function applyStudentAttendanceUpdate(
  scope: StudentScope,
  attendance: StudentAttendance
): Promise<StudentUpdateResult | null> {
  const existingStudent = await getStudentState(scope);

  if (!existingStudent) {
    return null;
  }

  const nextStatus = attendance === "ABSENT" ? "DROPPED" : existingStudent.status;
  const nextPresence = attendance === "ABSENT" ? "NONE" : existingStudent.presence;
  const seatDelta = getSeatDelta(existingStudent.status, nextStatus);
  const changed =
    existingStudent.attendance !== attendance ||
    existingStudent.status !== nextStatus ||
    existingStudent.presence !== nextPresence;

  if (!changed) {
    return {
      changed: false,
      hours: getCurrentHourInTimeZone(),
      student: existingStudent,
    };
  }

  const updatedStudent = await db.$transaction(async (tx) => {
    const student = await tx.student.update({
      where: { id: existingStudent.id },
      data: {
        attendance,
        status: nextStatus,
        presence: nextPresence,
      },
      include: studentStateInclude,
    });

    if (existingStudent.busId) {
      await updateBusSeats(tx, existingStudent.busId, seatDelta);
    }

    return student;
  });

  revalidateStudentState();

  return {
    changed: true,
    hours: getCurrentHourInTimeZone(),
    student: updatedStudent,
  };
}

export async function applyStudentStatusUpdate(
  scope: StudentScope,
  status: StudentStatus,
  hours = getCurrentHourInTimeZone()
): Promise<StudentUpdateResult | null> {
  const existingStudent = await getStudentState(scope);

  if (!existingStudent) {
    return null;
  }

  const attendance: StudentAttendance = "PRESENT";
  const presence = getPresenceFromStatus(status, hours);
  const seatDelta = getSeatDelta(existingStudent.status, status);
  const changed =
    existingStudent.status !== status ||
    existingStudent.attendance !== attendance ||
    existingStudent.presence !== presence;

  if (!changed) {
    return {
      changed: false,
      hours,
      student: existingStudent,
    };
  }

  const updatedStudent = await db.$transaction(async (tx) => {
    const student = await tx.student.update({
      where: { id: existingStudent.id },
      data: {
        status,
        attendance,
        presence,
      },
      include: studentStateInclude,
    });

    if (existingStudent.busId) {
      await updateBusSeats(tx, existingStudent.busId, seatDelta);
    }

    return student;
  });

  revalidateStudentState();

  return {
    changed: true,
    hours,
    student: updatedStudent,
  };
}

export async function applyStudentPresenceUpdate(
  scope: StudentScope,
  presence: StudentPresence
): Promise<StudentUpdateResult | null> {
  const existingStudent = await getStudentState(scope);

  if (!existingStudent) {
    return null;
  }

  if (existingStudent.presence === presence) {
    return {
      changed: false,
      hours: getCurrentHourInTimeZone(),
      student: existingStudent,
    };
  }

  const updatedStudent = await db.student.update({
    where: { id: existingStudent.id },
    data: { presence },
    include: studentStateInclude,
  });

  revalidateStudentState();

  return {
    changed: true,
    hours: getCurrentHourInTimeZone(),
    student: updatedStudent,
  };
}

export { getCurrentHourInTimeZone };
