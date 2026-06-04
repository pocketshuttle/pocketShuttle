import "server-only";

import { revalidateTag } from "next/cache";

import { Prisma } from "@prisma/client";
import db, {
  StudentAttendance,
  StudentPresence,
  StudentStatus,
} from "@/packages/db/client";

const DEFAULT_TIMEZONE = "Africa/Lagos";
const STATE_TAGS = ["students", "parent", "new-parent", "teacher", "collection"] as const;

const studentStateInclude = {
  parent: {
    select: {
      id: true,
      full_name: true,
      email: true,
      phoneNumber: true,
    },
  },
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
  teacherId?: string | null;
};

type StudentUpdateResult = {
  changed: boolean;
  hours: number;
  student: StudentStateRecord;
  blockedReason?: "NOT_PRESENT";
};

type StudentActor = {
  [key: string]: unknown;
  id?: unknown;
  role?: unknown;
  schoolId?: unknown;
};

function getStringValue(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

export function getStudentScopeForActor(
  studentId: string,
  actor: StudentActor
): StudentScope {
  const role = String(actor.role ?? "").toLowerCase();
  const actorId = getStringValue(actor.id);
  const actorSchoolId = getStringValue(actor.schoolId);
  const schoolId =
    actorSchoolId ?? (role === "admin" || role === "school" ? actorId : null);

  return {
    studentId,
    schoolId,
    teacherId: role === "teacher" ? actorId : null,
  };
}

function getStudentWhere({
  studentId,
  schoolId,
  teacherId,
}: StudentScope): Prisma.StudentWhereInput {
  const where: Prisma.StudentWhereInput = { id: studentId };

  if (schoolId) {
    where.schoolId = schoolId;
  }

  if (teacherId) {
    where.OR = [
      { teacherId },
      {
        bus: {
          teacher: {
            id: teacherId,
          },
        },
      },
    ];
  }

  return where;
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

  if (delta < 0) {
    await tx.buses.updateMany({
      where: {
        id: busId,
        availableSeats: {
          gt: 0,
        },
      },
      data: {
        availableSeats: { decrement: Math.abs(delta) },
      },
    });
    return;
  }

  const bus = await tx.buses.findUnique({
    where: { id: busId },
    select: { availableSeats: true, seat_number: true },
  });

  if (!bus) {
    return;
  }

  await tx.buses.update({
    where: { id: busId },
    data: {
      availableSeats: Math.min(bus.seat_number, bus.availableSeats + delta),
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

  if (presence === "ON_THE_WAY" && existingStudent.attendance !== "PRESENT") {
    return {
      changed: false,
      hours: getCurrentHourInTimeZone(),
      student: existingStudent,
      blockedReason: "NOT_PRESENT",
    };
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
