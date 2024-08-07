import NewUser from "@/(models)/NewUser";
import Parent from "@/(models)/Parent";
import Teacher from "@/(models)/Teachers";
import User from "@/(models)/User";

export const getUserByEmail = async (email: string, role?: string) => {
  try {
    let user;

    if (role) {
      if (role === "parent") {
        user = await Parent.findOne({ email: email });
      } else if (role === "teacher") {
        user = await Teacher.findOne({ email: email });
        console.log(user, "user from teacher");
      }
    } else {
      user = await User.findOne({ email: email });
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
        user = await Parent.find({ _id: id });
      } else if (role === "teacher") {
        user = await Teacher.find({ _id: id });
      }
    } else {
      user = await User.find({ _id: id });
    }

    return user;
  } catch (error) {
    console.error(`Error fetching user by ID: ${id}`, error);
    return null;
  }
};

export const getCreatedUser = async (email: string) => {
  try {
    const user = await NewUser.findOne({ email: email })
      .populate("teacher")
      .populate("parent");

    return user;
  } catch (error) {
    console.error("Error fetching user by email:", error);
    return null;
  }
};
