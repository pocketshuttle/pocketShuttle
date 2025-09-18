const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();

app.use(cors({
  origin: ["http://localhost:3000"], 
  methods: ["GET", "POST"]
}));

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000"],
    methods: ["GET", "POST"],
  },
});

io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (token && token === process.env.SECRET_TOKEN) {
    return next();
  }
  next(new Error("Unauthorized"));
});

io.on("connection", (socket) => {
  console.log(" Client connected:", socket.id);

  socket.on("teacher-live-location", (data) => {
    console.log(" Location received:", data);

    // Broadcast only to parents, not back to sender (optional)
    socket.broadcast.emit("teacher-location-update", data);
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(` Socket.IO server running on port ${PORT}`);
});
