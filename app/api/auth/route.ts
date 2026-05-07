import { NextResponse } from "next/server";

import { AUTH_COOKIE, makeAuthToken, verifyCredentials } from "@/lib/auth";

export const runtime = "nodejs";

const COOKIE_MAX_AGE = 60 * 60 * 8; // 8 hours

export async function POST(req: Request) {
  let body: { action?: string; username?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (body.action === "logout") {
    const res = NextResponse.json({ ok: true });
    res.cookies.set(AUTH_COOKIE, "", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 0
    });
    return res;
  }

  const { username, password } = body;
  if (!username || !password) {
    return NextResponse.json({ error: "Username and password required" }, { status: 400 });
  }

  if (!verifyCredentials(username, password)) {
    // small delay to discourage rapid brute-force
    await new Promise((r) => setTimeout(r, 350));
    return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
  }

  const token = makeAuthToken();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(AUTH_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: COOKIE_MAX_AGE
  });
  return res;
}
