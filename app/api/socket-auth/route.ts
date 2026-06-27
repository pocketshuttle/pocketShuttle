import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { decrypt } from "@/lib/create-session";

export async function GET() {
  try {
    const cookie = (await cookies()).get("session")?.value;
    if (!cookie) {
      return NextResponse.json({ error: "No Session" }, { status: 401 });
    }

    const session = await decrypt(cookie);
    if (!session) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    // Ensure secret is configured
    const secret = process.env.SOCKET_AUTH_SECRET;
    if (!secret) {
      console.error("Missing SOCKET_AUTH_SECRET env variable");

      return NextResponse.json(
        { error: "Server misconfiguration" },
        { status: 500 }
      );
    }

    // Sign short-lived socket token
    const socketToken = jwt.sign(
      {
        id: session.id,
        role: session.role,
        email: session.email,
        schoolId: session.schoolId,
      },
      secret,
      { expiresIn: "1h" }
    );


    return NextResponse.json({ token: socketToken });
  } catch (err) {
    console.error("/api/socket-auth error", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
