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
    default: null,
  },
  parent: {
    type: Schema.Types.ObjectId,
    ref: "Parent",
    default: null,
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Teacher",
    default: null,
  },
  bus: { type: mongoose.Schema.Types.ObjectId, ref: "Buses", default: null },
  status: {
    type: String,
    enum: ["dropped", "picked"],
    default: "dropped",
  },
  attendance: {
    type: String,
    enum: ["absent", "present"],
    default: "absent",
  },
  presence: {
    type: String,
    enum: ["In bus", "At school"],
    default: "In bus",
  },
});

const Student = models.Student || model("Student", studentSchema);
export default Student;
