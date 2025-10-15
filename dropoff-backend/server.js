import express from "express";
import http from "http";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import cors from "cors";
import dotenv from "dotenv";
import { PrismaClient } from "../packages/db/node_modules/.prisma/client/index.js";

dotenv.config();

const app = express();
const db = new PrismaClient();

app.use(
  cors({
    origin: [process.env.FRONTEND_ORIGIN || "http://localhost:3000"],
    methods: ["GET", "POST"],
    credentials: true,
  })
);

const server = http.createServer(app);

// console.log(server, "from socket");
// console.log("hello world");

const io = new Server(server, {
  cors: {
    origin: [process.env.FRONTEND_ORIGIN || "http://localhost:3000"],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

const teacherRateLimitMap = new Map();
const RATE_LIMIT_MS = 1000;

// console.log(io, "from socket");

io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  // console.log(token, "from socket.io");
  if (!token) return next(new Error("Authentication required"));

  try {
    const payload = jwt.verify(token, process.env.SOCKET_AUTH_SECRET);
    // console.log(payload, "from socket.io");
    socket.user = payload;

    next();
  } catch {
    next(new Error("Invalid or expired token"));
  }
});

io.on("connection", (socket) => {
  /**
   * Schools subscribe to all teachers in their school
   */
  socket.on("subscribe-school", ({ schoolId }) => {
    if (!schoolId) return;
    socket.join(`school-${schoolId}`);
    // console.log(`Socket ${socket.id} subscribed to school-${schoolId}`);
  });

  /**
   * Parents subscribe to a specific teacher (their child's teacher)
   */
  socket.on("subscribe-teacher", async ({ teacherId, parentId }) => {
    if (!teacherId || !parentId) return;

    const parent = await db.parent.findUnique({
      where: { id: parentId },
      include: {
        Student: { include: { bus: { include: { teacher: true } } } },
      },
    });

    // // 2. Check if any of parent’s kids belong to this teacher's buss
    const allowed = parent?.Student.some(
      (student) => student.bus?.teacher?.id === teacherId
    );

    console.log(allowed, "allowed from subscribe teacher");


    if (allowed) {
      socket.join(`teacher-${teacherId}`);
      console.log(`Parent ${parentId} joined teacher ${teacherId}`);
    } else {
      console.warn(`Unauthorized subscription attempt by ${parentId}`);
      socket.emit("error", "Not authorized for this teacher.");
    }
  });

  /**
   * Teacher sends live location updates
   */
  socket.on("teacher-live-location", (data) => {
    // console.log(data, "from navbar");
    if (!socket.user || socket.user.role?.toLowerCase() !== "teacher") {
      return socket.emit("unauthorized", {
        message: "Only teachers can send live location",
      });
    }

    const teacherId = socket.user.id;

    // console.log(teacherId, "teachert Idf");

    // const now = Date.now();
    // const lastUpdate = teacherRateLimitMap.get(teacherId) || 0;

    // if (now - lastUpdate < RATE_LIMIT_MS) {
    //   return socket.emit("rate-limit", {
    //     message: "Too many updates. Please slow down.",
    //   });
    // }

    // teacherRateLimitMap.set(teacherId, now);

    const payload = {
      teacherId: socket.user.id,
      ...data,
    };

    // 1. Send to parents subscribed to this teacher
    io.to(`teacher-${teacherId}`).emit("teacher-location-update", payload);

    // console.log(`teacher-${teacherId}`, "connecetd from parent");
    // console.log(socket.user.schoolId, "from the SCHOOL");

    // 2. Send to school staff subscribed to this teacher's school
    io.to(`school-${socket.user.schoolId}`).emit(
      "teacher-location-update",
      payload
    );

    // console.log(payload, "paylaod from teachewr");
  });

  socket.on("disconnect", () => {
    console.log("Socket disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Socket.IO server running on port ${PORT}`);
});
