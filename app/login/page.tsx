import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { AnimatedBackground } from "@/components/animated-background";
import { LoginForm } from "@/components/login-form";
import { VodafoneLogo } from "@/components/vodafone-logo";
import { Card } from "@/components/ui/card";
import { Spotlight } from "@/components/ui/spotlight";
import { SplineScene } from "@/components/ui/splite";
import { AUTH_COOKIE, verifyToken } from "@/lib/auth";

export default function LoginPage() {
  const token = cookies().get(AUTH_COOKIE)?.value;
  if (verifyToken(token)) redirect("/chat");

  return (
    <main className="relative min-h-[100dvh] w-full flex items-center justify-center p-4 sm:p-8">
      <AnimatedBackground />

      <Card className="w-full max-w-5xl h-[600px] bg-white/95 border-vodafone-red/20 relative overflow-hidden shadow-[0_20px_70px_-30px_rgba(230,0,0,0.35)]">
        <Spotlight className="-top-40 left-0 md:left-60 md:-top-20" fill="#E60000" />

        <div className="flex h-full flex-col md:flex-row">
          {/* Left: form */}
          <div className="flex-1 p-8 sm:p-12 relative z-10 flex flex-col justify-center">
            <div className="flex items-center gap-3 mb-8">
              <VodafoneLogo size={48} />
              <div>
                <p className="text-[11px] uppercase tracking-[0.2em] text-vodafone-red/80">
                  Vodafone Egypt
                </p>
                <h1 className="text-2xl font-semibold text-zinc-900">Candidate Process Filtration</h1>
              </div>
            </div>

            <h2 className="text-3xl md:text-4xl font-bold text-zinc-900 mb-2">
              Welcome back.
            </h2>
            <p className="text-zinc-600 mb-8 max-w-sm">
              Sign in to manage candidate intake and search through your talent pipeline.
            </p>

            <LoginForm />
          </div>

          {/* Right: 3D scene */}
          <div className="hidden md:block flex-1 relative">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(230,0,0,0.18),transparent_60%)]" />
            <SplineScene
              scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
              className="w-full h-full"
            />
          </div>
        </div>
      </Card>
    </main>
  );
}
