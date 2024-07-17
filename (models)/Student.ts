import mongoose from "mongoose";

const { Schema, models, model } = mongoose;

const studentSchema = new Schema({
  school_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  full_name: String,
  age: String,
  image: String,
  grade: String,
  gender: String,
  address: String,

  driver: {
    type: Schema.Types.ObjectId,
    ref: "Driver",
  },
  parent: {
    type: Schema.Types.ObjectId,
    ref: "Parent",
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Teacher",
  },
  bus: { type: mongoose.Schema.Types.ObjectId, ref: "Buses" },
});

const Student = models.Student || model("Student", studentSchema);
export default Student;
