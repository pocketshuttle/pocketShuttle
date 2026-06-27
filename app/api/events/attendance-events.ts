// pages/api/attendance-events.ts

import { NextApiRequest, NextApiResponse } from "next";

let clients: NextApiResponse[] = []; // Store active connections

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log("hello");
  // Allow only GET requests
  if (req.method !== "GET") {
    res.status(405).json({ message: "Method Not Allowed" });
    return;
  }

  // Set headers for Server-Sent Events (SSE)
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Access-Control-Allow-Origin", "*");

  res.flushHeaders();

  res.write(`data: Test connection established\n\n`);
  res.end();

  // Add the client to the list of connections
  clients.push(res);

  // Handle client disconnect
  req.on("close", () => {
    clients = clients.filter((client) => client !== res);
    res.end(); // Close the response stream
  });

  // Optional: Send a heartbeat every 30s to keep the connection alive
  const pingInterval = setInterval(() => {
    if (res.writableEnded) {
      clearInterval(pingInterval);
    } else {
      res.write("event: ping\ndata: {}\n\n");
    }
  }, 30000);
}

// Helper function to broadcast attendance updates to all clients
export function broadcastAttendanceUpdate(data: Record<string, any>) {
  const message = `data: ${JSON.stringify(data)}\n\n`;
  clients.forEach((client) => {
    try {
      client.write(message);
    } catch (error) {
      console.error("Failed to send update:", error);
    }
  });
}
