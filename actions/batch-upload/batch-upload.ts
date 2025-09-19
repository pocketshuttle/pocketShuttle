"use server";

import * as XLSX from "xlsx";
import csv from "csv-parser";
import fs from "fs";
import path, { resolve } from "path";
import { randomUUID } from "crypto";
import { db } from "@/lib/db";

type ImportResult = {
  success: boolean;
  count?: number;
  errors?: string[];
};

export async function importStudents(
  formData: FormData
): Promise<ImportResult> {
  const file = formData.get("file") as File;
  const schoolId = formData.get("schoolId") as string;
  //validating the files, and schoolId
  if (!file || !schoolId)
    return { success: false, errors: ["Missing file or schoolId"] };

  const tempDir = path.join(process.cwd(), "tmp");
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

  const tempPath = path.join(tempDir, `${randomUUID()}-${file.name}`);
  fs.writeFileSync(tempPath, Buffer.from(await file.arrayBuffer()));

  const ext = path.extname(file.name).toLowerCase();
  const results: any[] = [];

  try {
    if (ext === ".csv") {
      await new Promise<void>((resolve, reject) => {
        fs.createReadStream(tempPath)
          .pipe(csv())
          .on("data", (row) => results.push(row))
          .on("end", () => resolve())
          .on("error", reject);
      });
    } else if (ext === ".xlsx" || ext === ".xls") {
      const workbook = XLSX.readFile(tempPath);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      results.push(...XLSX.utils.sheet_to_json(sheet));
    } else {
      return { success: false, errors: ["Unsupported file type"] };
    }

    const students = results.map((row, i) => {
    //   console.log(row, "the row of students");
      try {
        return {
          schoolId,
          full_name: row["Name"] ?? null,
          age: row["Age"] ? parseInt(row["Age"]) : null,
          image: row["Image"] ?? null,
          grade: row["Grade"] ?? null,
          gender: row["Gender"] ?? null,
          address: row["Address"] ?? null,
        };
      } catch (err: any) {
        console.log(err, "error frmo the upload");
        throw new Error(`Row ${i + 1} invalid: ${err.message}`);
      }
    });

    await db.student.createMany({
      data: students,
      skipDuplicates: true,
    });

    return { success: true, count: students.length };
  } catch (err: any) {
    return { success: false, errors: [err.message] };
  } finally {
    if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
  }
}
