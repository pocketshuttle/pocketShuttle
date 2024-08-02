import User from "@/(models)/User";

export const getUserByEmail = async (email: string) => {
  try {
    const user = await User.findOne({ email: email });
    return user;
  } catch {
    return null;
  }
};

export const getUserById = async (id: string) => {
  try {
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
