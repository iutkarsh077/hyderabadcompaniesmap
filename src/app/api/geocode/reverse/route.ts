import { NextResponse } from "next/server";
import { reverseGeocode } from "@/lib/geocode";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const latitude = Number(searchParams.get("lat"));
  const longitude = Number(searchParams.get("lng"));

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return NextResponse.json({ error: "Invalid coordinates" }, { status: 400 });
  }
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    return NextResponse.json({ error: "Coordinates out of range" }, { status: 400 });
  }

  try {
    const result = await reverseGeocode(latitude, longitude);
    return NextResponse.json({ result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Reverse geocode failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
