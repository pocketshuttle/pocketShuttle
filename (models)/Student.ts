import mongoose from "mongoose";

const { Schema, models, model } = mongoose;

const studentSchema = new Schema({
  fullname: String,
  age: String,
  image: String,
  grade: String,
  address: String,
  parent: {
    type: Schema.Types.ObjectId,
    ref: "Parent",
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Teacher",
    required: true,
  },
  bus: { type: mongoose.Schema.Types.ObjectId, ref: "Bus" },
});

const Student = models.Student || model("Student", studentSchema);
export default Student;
