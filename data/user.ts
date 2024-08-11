import NewUser from "@/(models)/NewUser";
import Parent from "@/(models)/Parent";
import Teacher from "@/(models)/Teachers";
import User from "@/(models)/User";
import { db } from "@/lib/db";

export const getUserByEmail = async (email: string, role?: string) => {
  try {
    let user;

    if (role) {
      if (role === "parent") {
        // user = await Parent.findOne({ email: email });
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
      // user = await User.findOne({ email: email });
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
    });
    // .populate("teacher")
    // .populate("parent");

    return user;
  } catch (error) {
    console.error("Error fetching user by email:", error);
    return null;
  }
};
