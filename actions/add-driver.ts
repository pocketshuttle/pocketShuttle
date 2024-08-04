"use server";

import Buses from "@/(models)/Bus";
import Driver from "@/(models)/Driver";
import Teacher from "@/(models)/Teachers";
import User from "@/(models)/User";
import { connectToDB } from "@/utils/connect-to-db";
import { NextResponse } from "next/server";

export const addDriver = async (id: string, busId: string) => {
  try {
    await connectToDB();
    const driver = await Driver.findById(id).populate("bus");
    console.log(driver);
    if (!driver) {
      return { message: "Teacher not found" };
    }
    await Buses.findByIdAndUpdate(
      busId,
      {
        driver: id,
      },
      { new: true, useFindAndModify: false }
    );
    driver.bus = busId;

    await driver.save();

    return { message: "Driver added to bus" };
  } catch (error) {
    console.error("Error updating driver:", error);
    return { message: "Error updating driver" };
  }
};
