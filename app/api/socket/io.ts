// pages/api/socket/io.ts
import { Server as NetServer } from "http";
import { NextApiRequest } from "next";
import { Server as SocketIOServer } from "socket.io";
import { NextApiResponseServerIO } from "@/types/next";
import db from "@/packages/db/client";
import { instrument } from "@socket.io/admin-ui";
import cors from "cors";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponseServerIO
) {
  if (!res.socket.server.io) {
    console.log("Initializing Socket.IO server...");

    const httpServer: NetServer = res.socket.server as any;

    const io = new SocketIOServer(httpServer, {
      path: "/api/socket/io",
      cors: {
        origin:
          process.env.NODE_ENV === "production"
            ? "https://app.pocketshuttle.com"
            : "http://localhost:3000",
        methods: ["GET", "POST"],
      },
      transports: ["websocket"],
    });
    if (process.env.SOCKET_ADMIN_USER && process.env.SOCKET_ADMIN_PASS) {
      instrument(io, {
        auth: {
          type: "basic",
          username: process.env.SOCKET_ADMIN_USER,
          password: process.env.SOCKET_ADMIN_PASS,
        },
      });
    }

    io.on("connection", async (socket) => {
      console.log("New client connected:", socket.id);

      socket.on("join-teacher-room", async (teacherId: string) => {
        socket.join(`teacher-${teacherId}`);
        console.log(`Teacher ${teacherId} connected`);
      });

      socket.on("join-parent-room", async (parentId: string) => {
        socket.join(`parent-${parentId}`);
        console.log(`Parent ${parentId} connected`);
      });

      socket.on(
        "teacher-location-update",
        async (data: {
          teacherId: string;
          teacherName: string;
          teacherImage: string;
          latitude: number;
          longitude: number;
        }) => {
          try {
            io.to(`teacher-${data.teacherId}`).emit(
              "teacher-location-update",
              data
            );

            const teacher = await db.teacher.findUnique({
              where: { id: data.teacherId },
              include: {
                bus: {
                  include: {
                    students: {
                      where: { presence: "ON_THE_WAY" },
                      include: { parent: true },
                    },
                  },
                },
              },
            });

            if (teacher?.bus?.students) {
              teacher.bus.students.forEach((student) => {
                if (student.parent?.id) {
                  io.to(`parent-${student.parent.id}`).emit(
                    "teacher-location-update",
                    data
                  );
                }
              });
            }

            console.log(
              `Location update processed for teacher ${data.teacherId}`
            );
          } catch (error) {
            console.error("Error processing location update:", error);
          }
        }
      );

      socket.on("disconnect", () => {
        console.log("Client disconnected:", socket.id);
      });
    });

    res.socket.server.io = io;
  }

  res.end();
}
