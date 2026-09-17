import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import DbConnect from "@/lib/mongodb";
import { setVerifySessionCookie } from "@/lib/verify-session";
import { VerifySecretModel } from "@/models/VerifySecret";

type LoginBody = {
  secret1?: unknown;
  secret2?: unknown;
  secret3?: unknown;
};

function asSecret(value: unknown) {
  return typeof value === "string" ? value : "";
}

export async function POST(request: Request) {
  let body: LoginBody;
  try {
    body = (await request.json()) as LoginBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const secrets = [asSecret(body.secret1), asSecret(body.secret2), asSecret(body.secret3)];
  if (secrets.some((secret) => !secret)) {
    return NextResponse.json({ error: "All three secrets are required" }, { status: 400 });
  }

  try {
    await DbConnect();
    const rows = await VerifySecretModel.find({ slot: { $in: [1, 2, 3] } }).lean();
    if (rows.length !== 3) {
      return NextResponse.json(
        { error: "Verify secrets are not configured. Run npm run seed:verify-secrets." },
        { status: 503 },
      );
    }

    const bySlot = new Map(rows.map((row) => [row.slot, row.hash]));
    const matches = await Promise.all(
      ([1, 2, 3] as const).map(async (slot, index) => {
        const hash = bySlot.get(slot);
        if (!hash) return false;
        return bcrypt.compare(secrets[index], hash);
      }),
    );

    if (!matches.every(Boolean)) {
      return NextResponse.json({ error: "Invalid secrets" }, { status: 401 });
    }

    await setVerifySessionCookie();
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Login failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
