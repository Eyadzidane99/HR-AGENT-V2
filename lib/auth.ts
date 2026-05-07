import { createHmac, timingSafeEqual } from "crypto";

export const AUTH_COOKIE = "hr_auth";
const VALID_USER = "Eyad_Zidane";
const VALID_PASS = "Test123456";

function safeEqual(a: string, b: string) {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

export function verifyCredentials(username: string, password: string) {
  return safeEqual(username, VALID_USER) && safeEqual(password, VALID_PASS);
}

function getSecret() {
  return process.env.AUTH_SECRET || "vodafone-hr-agent-dev-secret-change-me";
}

export function signToken(payload: string) {
  const sig = createHmac("sha256", getSecret()).update(payload).digest("hex");
  return `${payload}.${sig}`;
}

export function verifyToken(token: string | undefined): boolean {
  if (!token) return false;
  const idx = token.lastIndexOf(".");
  if (idx < 0) return false;
  const payload = token.slice(0, idx);
  const sig = token.slice(idx + 1);
  const expected = createHmac("sha256", getSecret()).update(payload).digest("hex");
  if (sig.length !== expected.length) return false;
  try {
    return timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
  } catch {
    return false;
  }
}

export function makeAuthToken() {
  return signToken(`${VALID_USER}:${Date.now()}`);
}
