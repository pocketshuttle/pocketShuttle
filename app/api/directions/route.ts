import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const origin = searchParams.get("origin");
  const destination = searchParams.get("destination");

  if (!origin || !destination) {
    return NextResponse.json(
      { error: "Origin and destination are required" },
      { status: 400 }
    );
  }

  const API_KEY = process.env.GOOGLE_MAPS_API_KEY;

  try {
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destination}&mode=driving&key=${API_KEY}`
    );

    if (!res.ok) {
      const errorText = await res.text();

      return NextResponse.json(
        { error: "Google Maps API error", message: errorText },
        { status: res.status }
      );
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching directions:", error);
    return NextResponse.json(
      { error: "Failed to fetch directions" },
      { status: 500 }
    );
  }
}
