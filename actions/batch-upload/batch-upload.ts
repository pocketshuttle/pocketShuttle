"use server";
// export const  runtime = "edge";

import db from "@/packages/db/client";
import { getApiSession, canManageSchool } from "@/lib/api-auth";
import {
  assertWithinLimit,
  getEntitlements,
  requireFeature,
} from "@/lib/billing/entitlements";

type ImportResult = {
  success: boolean;
  count?: number;
  errors?: string[];
};

// Allowed grades in our schema
const VALID_GRADES = [
  "Grade 1",
  "Grade 2",
  "Grade 3",
  "Grade 4",
  "Grade 5",
  "Grade 6",
  "Grade 7",
  "Grade 8",
  "Grade 9",
  "Grade 10",
  "Grade 11",
  "Grade 12",
];

function sanitizeString(input: any): string | null {
  if (!input || typeof input !== "string") return null;

  // Strip potential Excel formulas (like =CMD(...))
  const trimmed = input.trim();
  if (
    trimmed.startsWith("=") ||
    trimmed.startsWith("+") ||
    trimmed.startsWith("-") ||
    trimmed.startsWith("@")
  ) {
    return null;
  }

  // Prevent overly long strings
  if (trimmed.length > 255) return trimmed.slice(0, 255);

  return trimmed;
}

export async function importStudents(
  formData: FormData
): Promise<ImportResult> {
  const file = formData.get("file") as File;
  const schoolId = formData.get("schoolId") as string;

  if (!file || !schoolId) {
    return { success: false, errors: ["Missing file or schoolId"] };
  }

  try {
    const session = await getApiSession();
    if (!canManageSchool(session) || session.schoolId !== schoolId) {
      return { success: false, errors: ["Unauthorized school import"] };
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileName = file.name.toLowerCase();
    let results: any[] = [];

    if (fileName.endsWith(".csv")) {
      const { parse } = await import("csv-parse/sync");
      const content = buffer.toString("utf-8");
      results = parse(content, { columns: true, skip_empty_lines: true });
    } else {
      return { success: false, errors: ["Unsupported file type. Please upload a CSV file."] };
    }

    // Validate  sanitize
    const students = results.map((row, i) => {
      const full_name = sanitizeString(row["Name"]);
      const grade = sanitizeString(row["Grade"]);
      const gender = sanitizeString(row["Gender"]);
      const address = sanitizeString(row["Address"]);
      const image = sanitizeString(row["Image"]);
      const age = row["Age"] ? Number(row["Age"]) : null;

      if (!full_name) throw new Error(`Row ${i + 1}: Missing or invalid Name`);
      if (age !== null && (isNaN(age) || age < 3 || age > 25)) {
        throw new Error(`Row ${i + 1}: Invalid Age`);
      }
      if (grade && !VALID_GRADES.includes(grade)) {
        throw new Error(`Row ${i + 1}: Invalid Grade '${grade}'`);
      }
      if (
        gender &&
        !["M", "F", "Male", "Female", "male", "female"].includes(gender)
      ) {
        throw new Error(`Row ${i + 1}: Invalid Gender '${gender}'`);
      }

      return {
        schoolId,
        full_name,
        age,
        image,
        grade,
        gender,
        address,
      };
    });

    const [resolved, currentStudentCount] = await Promise.all([
      getEntitlements(session),
      db.student.count({ where: { schoolId } }),
    ]);
    requireFeature(resolved, "csv_import");
    assertWithinLimit(
      resolved,
      "max_students",
      currentStudentCount,
      students.length
    );

    await db.student.createMany({
      data: students,
      skipDuplicates: true,
    });

    return { success: true, count: students.length };
  } catch (err: any) {
    return { success: false, errors: [err.message] };
  }
}
