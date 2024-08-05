import mongoose from "mongoose";
const { Schema, model, models } = mongoose;

const newUserSchema = new Schema({
  school_id: { type: Schema.Types.ObjectId, ref: "User" },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["parent", "teacher"], required: true },
  parent: { type: Schema.Types.ObjectId, ref: "Parent" },
  teacher: { type: Schema.Types.ObjectId, ref: "Teacher" },
});

const NewUser = models?.NewUser || model("NewUser", newUserSchema);

export default NewUser;
