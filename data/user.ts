"use server";

import db from "@/packages/db/client";

export const getUserByEmail = async (email: string, role?: string) => {
  try {
    let user;
    const normalizedEmail = email.toLowerCase();
    const normalizedRole = role?.toLowerCase();

    if (normalizedRole && normalizedRole !== "admin") {
      if (normalizedRole === "parent") {
        user = await db.parent.findUnique({
          where: {
            email: normalizedEmail,
          },
        });
      } else if (normalizedRole === "driver") {
        user = await db.driver.findUnique({
          where: {
            email: normalizedEmail,
          },
        });
      } else if (normalizedRole === "teacher") {
        user = await db.teacher.findUnique({
          where: {
            email: normalizedEmail,
          },
        });
      } else if (normalizedRole === "admin") {
        user = await db.user.findUnique({
          where: {
            email: normalizedEmail,
          },
        });
      }
    } else {
      user = await db.user.findUnique({
        where: {
          email: normalizedEmail,
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
    const normalizedRole = role?.toLowerCase();

    if (normalizedRole) {
      if (normalizedRole === "parent") {
        user = await db.parent.findUnique({
          where: {
            id,
          },
        });
      } else if (normalizedRole === "driver") {
        user = await db.driver.findUnique({
          where: {
            id,
          },
        });
      } else if (normalizedRole === "teacher") {
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
