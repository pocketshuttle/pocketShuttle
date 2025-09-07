"use server";
import { db } from "@/lib/db";

export const getUserByEmail = async (email: string, role?: string) => {
  try {
    let user;

    if (role && role.toLowerCase() !== "admin") {
      if (role === "parent") {
        user = await db.parent.findUnique({
          where: {
            email,
          },
        });
      } else if (role === "teacher") {
        user = await db.teacher.findUnique({
          where: {
            email,
          },
        });
      }
    } else {
      user = await db.user.findUnique({
        where: {
          email,
        },
      });
    }

    return user;
  } catch (error) {
    console.error("Error fetching user by email:", error);
    return null;
  }
};

export const getUserById = async (id: string, role?: string) => {
  try {
    let user;
    if (role) {
      if (role === "parent") {
        user = await db.parent.findUnique({
          where: {
            id,
          },
        });
      } else if (role === "teacher") {
        user = await db.teacher.findUnique({
          where: {
            id,
          },
        });
      }
    } else {
      user = await db.user.findUnique({
        where: {
          id,
        },
      });
    }

    return user;
  } catch (error) {
    console.error(`Error fetching user by ID: ${id}`, error);
    return null;
  }
};

export const getCreatedUser = async (email: string) => {
  try {
    const user = await db.newUser.findUnique({
      where: {
        email,
      },
      include: {
        teacher: true, // Include related teacher data
        parent: true, // Include related parent data
      },
    });

    return user;
  } catch (error) {
    console.error("Error fetching user by email:", error);
    return null;
  }
};

export const getCreatedById = async (id: string) => {
  try {
    const user = await db.newUser.findFirst({
      where: {
        OR: [
          {
            parentId: id,
          },
          {
            teacherId: id,
          },
        ],
      },
      include: {
        teacher: true, // Include related teacher data
        parent: true, // Include related parent data
      },
    });

    return user;
  } catch (error) {
    console.error("Error fetching user by email:", error);
    return null;
  }
};
