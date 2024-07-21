import mongoose from "mongoose";
const { Schema, models, model } = mongoose;

const busesSchema = new Schema({
  school_id: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  bus_number: {
    type: String,
    unique: true,
  },
  driver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Driver",
    default: null,
  },
  color: String,
  seat_number: Number,
  bus_product_name: String,
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Teacher",
    default: null,
  },
  student: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      default: [],
    },
  ],
  status: {
    type: String,
    enum: ["enroute", "parked"],
    default: "parked",
  },
  route: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Route",
    default: null,
  },
});

const Buses = models.Buses || model("Buses", busesSchema);
export default Buses;
