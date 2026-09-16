import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const VERIFY_SESSION_COOKIE = "verify_company_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 12; // 12 hours

function sessionSecret() {
  const secret = process.env.VERIFY_SESSION_SECRET;
  if (!secret) {
    throw new Error("VERIFY_SESSION_SECRET is missing");
  }
  return secret;
}

function sign(payload: string) {
  return createHmac("sha256", sessionSecret()).update(payload).digest("base64url");
}

export function createVerifySessionToken(now = Date.now()) {
  const exp = String(now + SESSION_TTL_MS);
  return `${exp}.${sign(exp)}`;
}

export function isValidVerifySessionToken(token: string | undefined, now = Date.now()) {
  if (!token) return false;
  const [exp, signature] = token.split(".");
  if (!exp || !signature) return false;

  const expected = sign(exp);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return false;

  const expiresAt = Number(exp);
  return Number.isFinite(expiresAt) && expiresAt > now;
}

export async function setVerifySessionCookie() {
  const jar = await cookies();
  jar.set(VERIFY_SESSION_COOKIE, createVerifySessionToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_MS / 1000,
  });
}

export async function clearVerifySessionCookie() {
  const jar = await cookies();
  jar.delete(VERIFY_SESSION_COOKIE);
}

export async function requireVerifySession() {
  const jar = await cookies();
  const token = jar.get(VERIFY_SESSION_COOKIE)?.value;
  if (!isValidVerifySessionToken(token)) {
    return false;
  }
  return true;
}
