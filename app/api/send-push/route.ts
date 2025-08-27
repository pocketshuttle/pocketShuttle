const url = "https://api.onesignal.com/notifications?c=push";
const ONE_SIGNAL_APP_ID = process.env.NEXT_PUBLIC_APP_ID!;
const ONE_SIGNAL_REST_KEY = process.env.ONE_SIGNAL!;

console.log("ONE_SIGNAL_APP_ID:", ONE_SIGNAL_APP_ID);
console.log("ONE_SIGNAL_REST_KEY:", ONE_SIGNAL_REST_KEY ? "Exists" : "Missing");

import { NextRequest, NextResponse } from "next/server";
export const POST = async (req: NextRequest) => {
  const data = await req.json();
  console.log("Received data:", data);

  if (!data.message) {
    return NextResponse.json({
      message: "Please add a message!",
      status: 400,
    });
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Key ${process.env.ONE_SIGNAL!}`,
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        app_id: ONE_SIGNAL_APP_ID,
        target_channel: "push",
        excluded_segments: [],
        headings: { en: "PocketShuttle" },
        contents: { en: data.message },
        include_aliases: {
          external_id: [data.userId],
        },
        // included_segments: ["All"],
        // include_player_ids: ["your_player_id_here"],
        data: { foo: "bar" },
        ios_badgeType: "Increase",
        ios_badgeCount: 1,
        ios_attachments: {
          id: "https://app.pocketshuttle.com/icon-256x256.png",
        },
        // android_channel_id: "push",
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
