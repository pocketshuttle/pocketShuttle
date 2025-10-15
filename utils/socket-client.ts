import { io } from "socket.io-client";

export async function connectSocket(
  teacherId: string,
  schoolId: string,
  parentId?: string
) {
  //we fetch the auth from the socket api
  const res = await fetch("/api/socket-auth", {
    method: "GET",
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to get socket token");

  const { token } = await res.json();

  const SOCKET_URL =
    process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000";

  const socket = io(SOCKET_URL, {
    auth: { token },
    transports: ["websocket"],
    timeout: 5000,
  });

  socket.on("connect", () => {
    // console.log("socket connected", socket.id);

    if (teacherId) {
      const payload = parentId ? { teacherId, parentId } : { teacherId };
      socket.emit("subscribe-teacher", payload);
    }

    if (schoolId) {
      socket.emit("subscribe-school", { schoolId });
      // console.log(`🏫 Subscribed to school-${schoolId}`);
    }
  });

  socket.on("teacher-location-update", (data) => {
    console.log(" Teacher location update:", data);
  });

  socket.on("unauthorized", (err) => {
    console.error("Unauthorized:", err.message);
  });

  socket.on("rate-limit", (msg) => {
    console.warn(" Rate limit hit:", msg.message);
  });

  socket.on("connect_error", (err) => {
    console.error("Socket connect_error:", err.message);
  });

  return socket;
}
