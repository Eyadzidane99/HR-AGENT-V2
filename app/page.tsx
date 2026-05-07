import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { AUTH_COOKIE, verifyToken } from "@/lib/auth";

export default function Home() {
  const token = cookies().get(AUTH_COOKIE)?.value;
  if (verifyToken(token)) redirect("/chat");
  redirect("/login");
}
