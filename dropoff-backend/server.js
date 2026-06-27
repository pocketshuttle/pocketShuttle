import express from "express";
import http from "http";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import cors from "cors";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";

dotenv.config();

const app = express();
const db = new PrismaClient();

app.get("/", (req, res) => {
  res.json({ message: "Backend live!", time: new Date().toISOString() });
});

app.use(
  cors({
    origin: [
      process.env.FRONTEND_ORIGIN,
      "https://app.pocketshuttle.com",
      "http://localhost:3000",
    ],
    methods: ["GET", "POST"],
    credentials: true,
  })
);

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: [
      process.env.FRONTEND_ORIGIN,
      "https://app.pocketshuttle.com",
      "http://localhost:3000",
    ],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

const teacherRateLimitMap = new Map();
const RATE_LIMIT_MS = 1000;

io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error("Authentication required"));

  try {
    const payload = jwt.verify(token, process.env.SOCKET_AUTH_SECRET);
    socket.user = payload;

    next();
  } catch {
    next(new Error("Invalid or expired token"));
  }
});

io.on("connection", (socket) => {
  const socketRole =
    typeof socket.user?.role === "string" ? socket.user.role.toLowerCase() : "";

  socket.on("subscribe-school", () => {
    if (!socket.user?.schoolId) return;
    if (!["admin", "school"].includes(socketRole)) {
      socket.emit("error", "Not authorized for school updates.");
      return;
    }

    socket.join(`school-${socket.user.schoolId}`);
  });

  socket.on("subscribe-teacher", async ({ teacherId }) => {
    if (!teacherId) return;
    if (socketRole !== "parent") {
      socket.emit("error", "Only parents can subscribe to teacher updates.");
      return;
    }

    const parentId = socket.user?.id;
    if (!parentId) {
      socket.emit("error", "Parent identity missing.");
      return;
    }

    const parent = await db.parent.findUnique({
      where: { id: parentId },
      include: {
        Student: { include: { bus: { include: { teacher: true } } } },
      },
    });

    const allowed = parent?.Student.some(
      (student) => student.bus?.teacher?.id === teacherId
    );

    if (allowed) {
      socket.join(`teacher-${teacherId}`);
      console.log(`Parent ${parentId} joined teacher ${teacherId}`);
    } else {
      console.warn(`Unauthorized subscription attempt by ${parentId}`);
      socket.emit("error", "Not authorized for this teacher.");
    }
  });

  socket.on("teacher-live-location", (data) => {
    if (!socket.user || socketRole !== "teacher") {
      return socket.emit("unauthorized", {
        message: "Only teachers can send live location",
      });
    }

    if (
      typeof data?.latitude !== "number" ||
      typeof data?.longitude !== "number"
    ) {
      return socket.emit("error", "Invalid location payload.");
    }

    const teacherId = socket.user.id;
    const now = Date.now();
    const lastUpdate = teacherRateLimitMap.get(teacherId) || 0;

    if (now - lastUpdate < RATE_LIMIT_MS) {
      return socket.emit("rate-limit", {
        message: "Too many updates. Please slow down.",
      });
    }

    teacherRateLimitMap.set(teacherId, now);

    const payload = {
      ...data,
      teacherId,
    };

    io.to(`teacher-${teacherId}`).emit("teacher-location-update", payload);

    io.to(`school-${socket.user.schoolId}`).emit(
      "teacher-location-update",
      payload
    );
  });

  socket.on("disconnect", () => {
    if (socket.user?.id) {
      teacherRateLimitMap.delete(socket.user.id);
    }
    console.log("Socket disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Socket.IO server running on port ${PORT}`);
});
