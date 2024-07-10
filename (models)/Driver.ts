// models/Driver.js
import mongoose from "mongoose";
const { Schema, models } = mongoose;

const driverSchema = new Schema(
  {
    driverId: String,
    name: String,
    phoneNumber: String,
    image: String,
    address: String,
    busId: { type: mongoose.Schema.Types.ObjectId, ref: "Bus", unique: true },
    busesId: { type: mongoose.Schema.Types.ObjectId, ref: "Buses" },
  },
  { collection: "drivers" }
);

const Driver = models.Driver || mongoose.model("Driver", driverSchema);
export default Driver;
