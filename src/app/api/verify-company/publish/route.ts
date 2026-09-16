import { NextResponse } from "next/server";
import DbConnect from "@/lib/mongodb";
import { publishCompanyToCityCollection } from "@/lib/publish-company";
import { requireVerifySession } from "@/lib/verify-session";
import { CompanySubmissionModel } from "@/models/CompanySubmission";

type PublishBody = {
  submissionId?: unknown;
};

export async function POST(request: Request) {
  if (!(await requireVerifySession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: PublishBody;
  try {
    body = (await request.json()) as PublishBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const submissionId = typeof body.submissionId === "string" ? body.submissionId.trim() : "";
  if (!submissionId) {
    return NextResponse.json({ error: "submissionId is required" }, { status: 400 });
  }

  try {
    await DbConnect();
    const submission = await CompanySubmissionModel.findById(submissionId);
    if (!submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }
    if (submission.status !== "pending") {
      return NextResponse.json({ error: "Submission is not pending" }, { status: 409 });
    }

    const collection = await publishCompanyToCityCollection({
      id: submission.id,
      name: submission.name,
      description: submission.description,
      industry: submission.industry,
      city: submission.city,
      latitude: submission.latitude,
      longitude: submission.longitude,
      website: submission.website,
      logo: submission.logo,
    });

    submission.status = "published";
    submission.publishedCollection = collection;
    submission.publishedAt = new Date();
    await submission.save();

    return NextResponse.json({
      ok: true,
      collection,
      companyId: submission.id,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Publish failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
