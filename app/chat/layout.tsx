import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { AnimatedBackground } from "@/components/animated-background";
import { AUTH_COOKIE, verifyToken } from "@/lib/auth";

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  const token = cookies().get(AUTH_COOKIE)?.value;
  if (!verifyToken(token)) redirect("/login");

  return (
    <>
      <AnimatedBackground />
      {children}
    </>
  );
}
