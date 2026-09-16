import { NextResponse } from "next/server";
import DbConnect from "@/lib/mongodb";
import { logoFor } from "@/types/company";
import { CompanySubmissionModel } from "@/models/CompanySubmission";

type SubmissionBody = {
  id?: unknown;
  name?: unknown;
  description?: unknown;
  industry?: unknown;
  city?: unknown;
  latitude?: unknown;
  longitude?: unknown;
  website?: unknown;
  logo?: unknown;
};

function asTrimmedString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function asNumber(value: unknown) {
  if (typeof value === "number") return value;
  if (typeof value === "string" && value.trim()) return Number(value);
  return NaN;
}

export async function POST(request: Request) {
  let body: SubmissionBody;
  try {
    body = (await request.json()) as SubmissionBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const id = asTrimmedString(body.id);
  const name = asTrimmedString(body.name);
  const description = asTrimmedString(body.description);
  const industry = asTrimmedString(body.industry);
  const city = asTrimmedString(body.city);
  const latitude = asNumber(body.latitude);
  const longitude = asNumber(body.longitude);
  const website = asTrimmedString(body.website) || undefined;
  const logo = asTrimmedString(body.logo) || logoFor(website) || undefined;

  if (!id || !name || !description || !industry || !city) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return NextResponse.json({ error: "Invalid coordinates" }, { status: 400 });
  }
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    return NextResponse.json({ error: "Coordinates out of range" }, { status: 400 });
  }

  try {
    await DbConnect();
    const doc = await CompanySubmissionModel.create({
      id,
      name,
      description,
      industry,
      city,
      latitude,
      longitude,
      ...(website ? { website } : {}),
      ...(logo ? { logo } : {}),
      status: "pending",
    });

    return NextResponse.json(
      {
        ok: true,
        submission: {
          _id: String(doc._id),
          id: doc.id,
          name: doc.name,
          city: doc.city,
          status: doc.status,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save submission";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
