import { NextRequest, NextResponse } from "next/server";

import db from "@/packages/db/client";
import { canManageSchool, getApiSession } from "@/lib/api-auth";

const url = "https://api.onesignal.com/notifications?c=push";
const ONE_SIGNAL_APP_ID = process.env.NEXT_PUBLIC_APP_ID!;

export const POST = async (req: NextRequest) => {
  const session = await getApiSession();
  const schoolId = session?.schoolId;
  if (!canManageSchool(session) || !schoolId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  const data = await req.json();

  if (!data.message || typeof data.message !== "string") {
    return NextResponse.json(
      { message: "Please add a message!" },
      { status: 400 }
    );
  }

  if (!data.userId || typeof data.userId !== "string") {
    return NextResponse.json(
      { message: "A target user is required" },
      { status: 400 }
    );
  }

  const message = data.message.trim();
  if (!message) {
    return NextResponse.json(
      { message: "Please add a message!" },
      { status: 400 }
    );
  }

  if (message.length > 500) {
    return NextResponse.json(
      { message: "Message is too long" },
      { status: 400 }
    );
  }

  try {
    if (!process.env.ONE_SIGNAL || !process.env.NEXT_PUBLIC_APP_ID) {
      return NextResponse.json(
        { error: "OneSignal configuration missing" },
        { status: 500 }
      );
    }

    const [parent, teacher, driver] = await Promise.all([
      db.parent.findFirst({
        where: { id: data.userId, schoolId },
        select: { id: true },
      }),
      db.teacher.findFirst({
        where: { id: data.userId, schoolId },
        select: { id: true },
      }),
      db.driver.findFirst({
        where: { id: data.userId, schoolId },
        select: { id: true },
      }),
    ]);

    const isSchoolTarget = data.userId === schoolId;
    if (!parent && !teacher && !driver && !isSchoolTarget) {
      return NextResponse.json(
        { message: "Target user is outside your school scope" },
        { status: 404 }
      );
    }

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Key ${process.env.ONE_SIGNAL}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        app_id: ONE_SIGNAL_APP_ID,
        target_channel: "push",
        excluded_segments: [],
        headings: { en: "PocketShuttle" },
        contents: { en: message },
        include_aliases: {
          external_id: [data.userId],
        },
        data: { foo: "bar" },
        ios_badgeType: "Increase",
        ios_badgeCount: 1,
        ios_attachments: {
          id: "https://app.pocketshuttle.com/icon-256x256.png",
        },
        big_picture: "https://app.pocketshuttle.com/icon-256x256.png",
        huawei_category: "MARKETING",
        huawei_msg_type: "message",
        huawei_big_picture: "https://app.pocketshuttle.com/icon-256x256.png",
        priority: 10,
        ios_interruption_level: "active",
        ttl: 259200,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: errorText },
        { status: response.status }
      );
    }
    const result = await response.json();
    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      { message: "Something went wrong", error: error.message },
      { status: 500 }
    );
  }
};
