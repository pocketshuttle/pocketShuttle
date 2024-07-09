import mongoose from "mongoose";
import clientPromise from "./db-promise";

let isConnected: boolean = false;

export const connectToDB = async () => {
  console.log("Connecting to MongoDB...");
  mongoose.set("strictQuery", true); // Ensure the query shape is strict

  if (isConnected) {
    console.log("Already connected to the database");
    return;
  }

  if (process.env.NODE_ENV === "development" && global.isConnected) {
    console.log("Already connected to the database in development");
    return;
  }

  try {
    await mongoose.connect(`${process.env.MONGODB_URI}`);

    isConnected = true;
    if (process.env.NODE_ENV === "development") {
      global.isConnected = true; // Track connection state globally in development
    }
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection error:", error);
  }
};
