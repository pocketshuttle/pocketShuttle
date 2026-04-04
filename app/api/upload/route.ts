import cloudinary from "cloudinary";
import { Readable } from "stream";
import { NextRequest, NextResponse } from "next/server";

import { getApiSession } from "@/lib/api-auth";

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

export const POST = async (req: NextRequest) => {
  try {
    const session = await getApiSession();
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      throw new Error("No file found in form data");
    }

    if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
      return NextResponse.json(
        { message: "Only image uploads are allowed" },
        { status: 400 }
      );
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json(
        { message: "File is too large. Maximum size is 5MB." },
        { status: 400 }
      );
    }

    cloudinary.v2.config({
      cloud_name: process.env.CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileStream = Readable.from(buffer);

    const result = await new Promise<string>((resolve, reject) => {
      const stream = cloudinary.v2.uploader.upload_stream(
        {
          folder: `pocketshuttle/${session.schoolId ?? session.id}`,
          resource_type: "image",
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            // @ts-ignore Cloudinary typings mark result as optional here
            resolve(result.secure_url);
          }
        }
      );

      fileStream.pipe(stream);
    });

    return new Response(JSON.stringify({ url: result }), {
      status: 200,
    });
  } catch (error) {
    console.error("Error uploading image to Cloudinary:", error);
    return new Response(
      JSON.stringify({ message: "Failed to upload image to Cloudinary" }),
      {
        status: 500,
      }
    );
  }
};
