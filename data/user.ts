import NewUser from "@/(models)/NewUser";
import User from "@/(models)/User";

export const getUserByEmail = async (email: string, role?: string) => {
  try {
    let user;

    if (role === "teacher" || role === "parent") {
      user = await NewUser.findOne({ email: email });
      console.log("teacher", user);
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
    console.log(id);

    const user = await User.find({ _id: id });
    if (!user) {
      console.error(`User not found with ID: ${id}`);
      return null;
    }
    return user;
  } catch (error) {
    console.error(`Error fetching user by ID: ${id}`, error);
    return null;
  }
};
