import { NextRequest, NextResponse } from "next/server";

import { getApiSession } from "@/lib/api-auth";
import { getPusherInstance } from "@/pusher/server";

export async function POST(req: NextRequest) {
  const session = await getApiSession();
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const socketId = String(formData.get("socket_id") || "");
  const channelName = String(formData.get("channel_name") || "");

  const allowedParentChannel =
    session.role === "parent" && channelName === `private-known-driver-parent-${session.id}`;
  const allowedDriverChannel =
    session.role === "driver" && channelName === `private-known-driver-driver-${session.id}`;

  if (!socketId || (!allowedParentChannel && !allowedDriverChannel)) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const auth = getPusherInstance().authorizeChannel(socketId, channelName);
  return NextResponse.json(auth);
}
