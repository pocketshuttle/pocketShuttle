import cloudinary from "cloudinary";
import { NextRequest, NextResponse } from "next/server";

import { canManagePlatform, getApiSession } from "@/lib/api-auth";

const PRIVATE_REF_PREFIX = "cloudinary:authenticated:";

export async function GET(req: NextRequest) {
  const session = await getApiSession();
  if (!canManagePlatform(session)) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const ref = new URL(req.url).searchParams.get("ref") || "";
  if (!ref.startsWith(PRIVATE_REF_PREFIX)) {
    return NextResponse.json({ message: "Invalid file reference" }, { status: 400 });
  }

  const publicId = ref.slice(PRIVATE_REF_PREFIX.length);
  if (!publicId.startsWith("pocketshuttle/standalone-drivers/")) {
    return NextResponse.json({ message: "Invalid file reference" }, { status: 400 });
  }

  cloudinary.v2.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  const signedUrl = cloudinary.v2.url(publicId, {
    secure: true,
    sign_url: true,
    type: "authenticated",
    resource_type: "image",
    expires_at: Math.floor(Date.now() / 1000) + 5 * 60,
  });

  return NextResponse.redirect(signedUrl);
}
