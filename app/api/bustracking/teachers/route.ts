import Ably from "ably";
import { NextRequest, NextResponse } from "next/server";

import db from "@/packages/db/client";
import { getApiSession, isTeacher } from "@/lib/api-auth";
import { recordTripLocation } from "@/lib/trip-events";

interface LocationUpdatePayload {
  latitude: number;
  longitude: number;
  accuracy?: number | null;
  speed?: number | null;
  heading?: number | null;
  teacherId: string;
  teacherImage: string | null;
  teacherName: string | null;
}

const ably = new Ably.Rest(process.env.ABLY_API_KEY!);

async function broadcastLocationUpdate(
  channel: string,
  data: LocationUpdatePayload
) {
  const ablyChannel = ably.channels.get(channel);
  return ablyChannel.publish("live-school-channel", data);
}

async function persistVehicleTripLocation({
  teacherId,
  schoolId,
  latitude,
  longitude,
  accuracy,
  speed,
  heading,
}: {
  teacherId: string;
  schoolId: string;
  latitude: number;
  longitude: number;
  accuracy?: number | null;
  speed?: number | null;
  heading?: number | null;
}) {
  const teacher = await db.teacher.findFirst({
    where: { id: teacherId, schoolId },
    select: {
      id: true,
      busId: true,
      bus: {
        select: {
          id: true,
          bus_product_name: true,
        },
      },
    },
  });

  const vehicleId = teacher?.busId ?? teacher?.bus?.id ?? null;
  if (!teacher || !vehicleId) {
    return null;
  }

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const existingTrip = await db.trip.findFirst({
    where: {
      vehicleId,
      status: {
        in: ["scheduled", "active", "paused"],
      },
      createdAt: {
        gte: todayStart,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const trip =
    existingTrip ??
    (await db.trip.create({
      data: {
        tripType: "school_trip",
        title: `${teacher.bus?.bus_product_name ?? "Vehicle"} live trip`,
        status: "active",
        safetyState: "normal",
        schoolId,
        busId: vehicleId,
        vehicleId,
        createdBy: teacher.id,
        startedAt: new Date(),
        metadata: {
          legacySource: "teacher_location_stream",
        },
      },
    }));

  await db.trip.update({
    where: { id: trip.id },
    data: {
      status: "active",
      startedAt: trip.startedAt ?? new Date(),
    },
  });

  await recordTripLocation({
    tripId: trip.id,
    lat: latitude,
    lng: longitude,
    accuracy,
    speed,
    heading,
  });

  return trip;
}

export async function POST(req: NextRequest) {
  try {
    const session = await getApiSession();
    const schoolId = session?.schoolId;
    if (!isTeacher(session) || !schoolId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { latitude, longitude, accuracy, speed, heading } =
      (await req.json()) as Partial<LocationUpdatePayload>;

    if (typeof latitude !== "number" || typeof longitude !== "number") {
      return NextResponse.json(
        { message: "Invalid latitude or longitude" },
        { status: 400 }
      );
    }

    const teacherRecord = await db.teacher.findFirst({
      where: { id: session.id, schoolId },
      select: {
        id: true,
        full_name: true,
        image: true,
      },
    });

    if (!teacherRecord) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    const locationData: LocationUpdatePayload = {
      latitude,
      longitude,
      accuracy: typeof accuracy === "number" ? accuracy : null,
      speed: typeof speed === "number" ? speed : null,
      heading: typeof heading === "number" ? heading : null,
      teacherId: teacherRecord.id,
      teacherImage: teacherRecord.image,
      teacherName: teacherRecord.full_name,
    };

    await persistVehicleTripLocation({
      teacherId: teacherRecord.id,
      schoolId,
      latitude,
      longitude,
      accuracy: typeof accuracy === "number" ? accuracy : null,
      speed: typeof speed === "number" ? speed : null,
      heading: typeof heading === "number" ? heading : null,
    });

    const teacher = await db.teacher.findUnique({
      where: { id: teacherRecord.id },
      include: {
        bus: {
          include: {
            students: {
              where: { presence: "ON_THE_WAY" },
              include: { parent: true },
            },
          },
        },
      },
    });

    if (teacher?.bus?.students) {
      const parentChannels = teacher.bus.students
        .filter((student) => student.parent?.id)
        .map((student) => `parent-${student.parent!.id}`);

      await Promise.all(
        parentChannels.map((channel) =>
          broadcastLocationUpdate(channel, locationData)
        )
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error processing request:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
