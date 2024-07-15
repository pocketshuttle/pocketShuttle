import mongoose from "mongoose";
import { string } from "zod";
const { Schema, models, model } = mongoose;

const busesSchema = new Schema({
  school_id: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  bus_number: String,
  // driver: { type: mongoose.Schema.Types.ObjectId, ref: "Driver" },
  driver: String,
  teacher: String,
  student: String,
  color: String,
  seat_Number: String,
  bus_product_name: String,
  // teacher: { type: mongoose.Schema.Types.ObjectId, ref: "Teacher" },
  // student: [
  //   {
  //     type: mongoose.Schema.Types.ObjectId,
  //     ref: "Student",
  //   },
  // ],
});

const Buses = models.Buses || model("Buses", busesSchema);
export default Buses;
