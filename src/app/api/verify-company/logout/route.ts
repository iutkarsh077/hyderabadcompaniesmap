import { NextResponse } from "next/server";
import { clearVerifySessionCookie } from "@/lib/verify-session";

export async function POST() {
  await clearVerifySessionCookie();
  return NextResponse.json({ ok: true });
}
