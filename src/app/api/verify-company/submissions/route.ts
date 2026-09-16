import { NextResponse } from "next/server";
import DbConnect from "@/lib/mongodb";
import { requireVerifySession } from "@/lib/verify-session";
import { CompanySubmissionModel } from "@/models/CompanySubmission";

export async function GET() {
  if (!(await requireVerifySession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await DbConnect();
    const docs = await CompanySubmissionModel.find({ status: "pending" })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      submissions: docs.map((doc) => ({
        _id: String(doc._id),
        id: doc.id,
        name: doc.name,
        description: doc.description,
        industry: doc.industry,
        city: doc.city,
        latitude: doc.latitude,
        longitude: doc.longitude,
        website: doc.website ?? null,
        logo: doc.logo ?? null,
        createdAt: doc.createdAt,
      })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load submissions";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
