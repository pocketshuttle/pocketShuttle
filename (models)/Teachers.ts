// models/Teacher.js
import mongoose from "mongoose";
const { Schema, models } = mongoose;

const teacherSchema = new Schema(
  {
    full_name: String,
    image: String,
    email: { type: String, unique: true, sparse: true },
    emailVerified: Date,
    password: String,
    address: String,
    phoneNumber: String,
    students: [{ type: mongoose.Schema.Types.ObjectId, ref: "Student" }],
    // busId: { type: mongoose.Schema.Types.ObjectId, ref: "Bus" },
  },
  { collection: "teachers" }
);

const Teacher = models.Teacher || mongoose.model("Teacher", teacherSchema);
export default Teacher;
