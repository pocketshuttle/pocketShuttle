import mongoose from "mongoose";

const { models, model, Schema } = mongoose;
const parentSchema = new Schema({
  full_name: String,
  email: { type: String, unique: true, sparse: true },
  image: { type: String },
  phoneNumber: String,
  address: String,
  students: [{ type: mongoose.Schema.Types.ObjectId, ref: "Student" }],
  bus: { type: mongoose.Schema.Types.ObjectId, ref: "Student" },
});

const Parent = mongoose.model("Parent", parentSchema);
export default Parent;
