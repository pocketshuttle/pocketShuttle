// models/Driver.js
import mongoose from "mongoose";
const { Schema, models } = mongoose;

const driverSchema = new Schema({
  school_id: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  full_name: String,
  phoneNumber: String,
  image: String,
  address: String,
  email: String,
  student: [
    {
      type: Schema.Types.ObjectId,
      ref: "Student",
      default: [],
    },
  ],
  bus: { type:Schema.Types.ObjectId, ref: "Buses" },
});

const Driver = models.Driver || mongoose.model("Driver", driverSchema);
export default Driver;
