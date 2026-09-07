import { NextResponse } from "next/server";
import { getCompanies } from "@/lib/companies";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const companies = await getCompanies();
    return NextResponse.json(companies);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load companies";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
