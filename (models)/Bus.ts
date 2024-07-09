import mongoose from "mongoose";
const { Schema, models, model } = mongoose;

const busesSchema = new Schema(
  {
    name: String,
    busNumber: String,
    driver: { type: mongoose.Schema.Types.ObjectId, ref: "Driver" },
    seatNumber: String,
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: "Teacher" },
    student: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Student",
      },
    ],
  },
  { collection: "buses" }
);

const Buses = models.Buses || model("Buses", busesSchema);
module.exports = Buses;
