import { NextResponse } from "next/server";

import { isCronRequestAuthorized } from "@/lib/cron/request-auth";
import {
  moveInBusStudentsToSchool,
  resetStudentDailyState,
  StudentUpdateClient,
} from "@/lib/cron/student-state";

type StudentCronDependencies = {
  authorize?: (request: Request) => Promise<boolean>;
  students?: StudentUpdateClient;
};

export function createResetStudentHandler(
  dependencies: StudentCronDependencies = {}
) {
  return async function resetStudent(request: Request) {
    const authorize = dependencies.authorize ?? isCronRequestAuthorized;
    if (!(await authorize(request))) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const result = await resetStudentDailyState(dependencies.students);
    return NextResponse.json({
      message: "Scheduled task completed successfully.",
      updated: result.count,
    });
  };
}

export function createResetStatusHandler(
  dependencies: StudentCronDependencies = {}
) {
  return async function resetStatus(request: Request) {
    const authorize = dependencies.authorize ?? isCronRequestAuthorized;
    if (!(await authorize(request))) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const result = await moveInBusStudentsToSchool(dependencies.students);
    return NextResponse.json({
      message: "Scheduled task completed successfully.",
      updated: result.count,
    });
  };
}
