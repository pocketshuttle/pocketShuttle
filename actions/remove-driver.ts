"use server";

import Buses from "@/(models)/Bus";
import Driver from "@/(models)/Driver";
import { connectToDB } from "@/utils/connect-to-db";

export const removeDriverFromBus = async (driverId: string, busId: string) => {
  try {
    await connectToDB();
    console.log(driverId, busId);

    const driver = await Driver.findById(driverId).populate("bus");

    const bus = await Buses.findById(busId);
    console.log(bus);
    console.log(driver);

    if (!driver) {
      return { message: "Teacher not found" };
    }
    if (!bus) {
      return { message: "Bus not found" };
    }
    if (!driver) {
      return { message: "Teacher not found" };
    }

    driver.busId = null;
    bus.teachher = null;

    await driver.save();
    await bus.save();
    return { message: "Driver removed from bus" };
  } catch (error) {
    console.error("Error updating Bus:", error);
    return { message: "Error updating Bus" };
  }
};
