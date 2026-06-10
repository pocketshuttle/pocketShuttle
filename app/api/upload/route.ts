import cloudinary from "cloudinary";
import { Readable } from "stream";
import { NextRequest, NextResponse } from "next/server";

import db from "@/packages/db/client";
import {
  canManageSchool,
  getApiSession,
  isDriver,
  isParent,
  isTeacher,
} from "@/lib/api-auth";

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);
const DRIVER_UPLOAD_PURPOSES = new Set([
  "driver-avatar",
  "driver-utility-bill",
  "driver-identity-document",
]);
const PARENT_UPLOAD_PURPOSES = new Set(["parent-child-image"]);
const PRIVATE_DRIVER_UPLOAD_PURPOSES = new Set([
  "driver-utility-bill",
  "driver-identity-document",
]);

function hasValidImageSignature(buffer: Buffer, mimeType: string) {
  if (mimeType === "image/jpeg") {
    return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }
  if (mimeType === "image/png") {
    return buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  }
  if (mimeType === "image/webp") {
    return buffer.subarray(0, 4).toString("ascii") === "RIFF" && buffer.subarray(8, 12).toString("ascii") === "WEBP";
  }
  return false;
}

export const POST = async (req: NextRequest) => {
  try {
    const session = await getApiSession();
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file");
    const purpose = String(formData.get("purpose") || "").trim();

    if (!(file instanceof File)) {
      throw new Error("No file found in form data");
    }

    let folder = `pocketshuttle/${session.schoolId ?? session.id}/general`;
    let privateUpload = false;

    if (purpose) {
      if (DRIVER_UPLOAD_PURPOSES.has(purpose)) {
        if (!isDriver(session)) {
          return NextResponse.json({ message: "Unauthorized upload purpose" }, { status: 403 });
        }

        const driver = await db.driver.findFirst({
          where: { id: session.id, accountType: "STANDALONE", schoolId: null },
          select: { id: true, verificationStatus: true },
        });

        if (!driver) {
          return NextResponse.json({ message: "Standalone driver not found" }, { status: 404 });
        }

        if (driver.verificationStatus === "VERIFIED") {
          return NextResponse.json(
            { message: "Verified accounts cannot update verification files. Contact customer care." },
            { status: 403 }
          );
        }

        folder = `pocketshuttle/standalone-drivers/${driver.id}/${purpose}`;
        privateUpload = PRIVATE_DRIVER_UPLOAD_PURPOSES.has(purpose);
      } else if (PARENT_UPLOAD_PURPOSES.has(purpose)) {
        if (!isParent(session)) {
          return NextResponse.json({ message: "Unauthorized upload purpose" }, { status: 403 });
        }

        const parent = await db.parent.findFirst({
          where: { id: session.id, accountType: "STANDALONE", schoolId: null },
          select: { id: true },
        });

        if (!parent) {
          return NextResponse.json({ message: "Standalone parent not found" }, { status: 404 });
        }

        folder = `pocketshuttle/standalone-parents/${parent.id}/${purpose}`;
      } else {
        return NextResponse.json({ message: "Invalid upload purpose" }, { status: 400 });
      }
    } else if (!canManageSchool(session) && !isTeacher(session)) {
      return NextResponse.json({ message: "Upload purpose is required" }, { status: 400 });
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
    if (!hasValidImageSignature(buffer, file.type)) {
      return NextResponse.json(
        { message: "Invalid image file" },
        { status: 400 }
      );
    }

    const fileStream = Readable.from(buffer);

    const result = await new Promise<string>((resolve, reject) => {
      const stream = cloudinary.v2.uploader.upload_stream(
        {
          folder,
          resource_type: "image",
          type: privateUpload ? "authenticated" : "upload",
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            if (!result) {
              reject(new Error("Cloudinary did not return an upload result"));
              return;
            }
            resolve(
              privateUpload
                ? `cloudinary:authenticated:${result.public_id}`
                : result.secure_url
            );
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
