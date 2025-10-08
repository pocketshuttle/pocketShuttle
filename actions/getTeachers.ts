import { revalidateTag } from "next/cache";
import db from "@/packages/db/client";

export const getTeachers = async (
  id: string,
  searchParams: URLSearchParams
) => {
  try {
    const ITEM_PER_PAGE = 2;

    // Extract search parameters
    const searchName = searchParams.get("q") || "";
    const page = parseInt(searchParams.get("page") || "1", 10);

    type TeacherWhere = NonNullable<
      Parameters<typeof db.teacher.findMany>[0]
    >["where"];

    const whereClause: TeacherWhere = {
      OR: [{ schoolId: id }, { id: id }],
      ...(searchName && {
        full_name: {
          contains: searchName,
          mode: "insensitive",
        },
      }),
    };

    // Fetch count of matching teachers
    const count = await db.teacher.count({
      where: whereClause,
    });

    // Fetch the teachers
    const teacher = await db.teacher.findMany({
      where: whereClause,
      include: {
        Student: true,
        bus: {
          include: {
            students: true,
            driver: true,
          },
        },
      },
      take: ITEM_PER_PAGE,
      skip: ITEM_PER_PAGE * (page - 1),
    });

    if (!teacher.length) {
      return new Response(JSON.stringify({ message: "Teacher not found!" }), {
        status: 404,
      });
    }

    // Revalidate cache tag
    revalidateTag("new-teacher");

    // Return the response
    return new Response(JSON.stringify({ teacher, count }), {
      status: 200,
    });
  } catch (error) {
    console.error(error);
    return new Response(
      JSON.stringify({
        message: "Error fetching teacher",
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500 }
    );
  }
};
