import mongoose from "mongoose";
const { Schema, models, model } = mongoose;

const busesSchema = new Schema({
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
});

const Buses = models.Buses || model("Buses", busesSchema);
export default Buses;
