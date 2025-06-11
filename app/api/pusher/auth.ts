import type { NextApiRequest, NextApiResponse } from "next";
import Pusher from "pusher";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const pusher = new Pusher({
    appId: process.env.PUSHER_APP_ID!,
    key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
    secret: process.env.PUSHER_SECRET!,
    cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    useTLS: true,
  });

  try {
    const { socket_id, channel_name } = req.body;
    const auth = pusher.authenticate(socket_id, channel_name, {
      user_id: req.body.parentId,
      user_info: {
        name: "parent-user",
      },
    });
    res.json(auth);
  } catch (error) {
    console.error("Authentication error:", error);
    res.status(403).json({ error: "Forbidden" });
  }
}
