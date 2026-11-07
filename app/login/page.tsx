import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Image from "next/image";

import { LoginForm } from "@/components/login-form";
import { VodafoneLogo } from "@/components/vodafone-logo";
import { AUTH_COOKIE, verifyToken } from "@/lib/auth";

export default function LoginPage() {
  const token = cookies().get(AUTH_COOKIE)?.value;
  if (verifyToken(token)) redirect("/chat");

  return (
    <main className="min-h-[100dvh] md:grid md:grid-cols-2">
      {/* Left: recruitment imagery */}
      <section className="relative hidden md:block overflow-hidden">
        <Image
          src="/images/interview.jpg"
          alt="Recruitment interview process"
          fill
          priority
          sizes="50vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-black/10" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(230,0,0,0.35),transparent_55%)]" />
        <div className="relative z-10 flex h-full flex-col justify-end p-12 text-white">
          <span className="mb-3 text-xs font-semibold uppercase tracking-[0.28em] text-white/70">
            Candidate Process Filtration
          </span>
          <h1 className="max-w-md text-4xl font-bold leading-tight tracking-tight">
            Hire smarter. Faster.
          </h1>
          <p className="mt-4 max-w-md text-base text-white/80">
            Manage candidate intake, screening, and search through your talent pipeline in one secure workspace.
          </p>
        </div>
      </section>

      {/* Right: form */}
      <section className="flex min-h-[100dvh] items-center justify-center bg-zinc-950 px-6 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-3">
            <VodafoneLogo size={44} />
            <div>
              <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-400">
                Vodafone Egypt
              </p>
              <h2 className="text-xl font-semibold text-white">Candidate Process Filtration</h2>
            </div>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Welcome back</h1>
          <p className="mt-2 mb-8 text-sm text-zinc-400">
            Sign in to continue to your recruitment workspace.
          </p>
          <LoginForm />
        </div>
      </section>
    </main>
  );
}