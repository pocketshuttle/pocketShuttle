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
    const user = await User.find({
      where: { id },
    });

    return user;
  } catch {
    return null;
  }
};
