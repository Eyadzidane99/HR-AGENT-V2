"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Lock, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NetworkTransition } from "@/components/network-transition";

export function LoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(0);
  const [transitioning, setTransitioning] = useState(false);

  useEffect(() => {
    router.prefetch("/chat");
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "login", username, password })
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body?.error || "Invalid credentials");
        setShake((s) => s + 1);
        setLoading(false);
        return;
      }
      // Successful login → kick off the SIM/4G network transition.
      // We start prefetching the chat route immediately so the navigation
      // at the end of the animation feels instant.
      router.prefetch("/chat");
      setTransitioning(true);
    } catch (err) {
      setError("Network error. Try again.");
      setShake((s) => s + 1);
      setLoading(false);
    }
  }

  return (
    <>
      <AnimatePresence>
        {transitioning ? (
          <NetworkTransition
            onComplete={() => {
              router.push("/chat");
              router.refresh();
            }}
          />
        ) : null}
      </AnimatePresence>
      <motion.form
      key={shake}
      onSubmit={handleSubmit}
      className="flex flex-col gap-5 w-full max-w-sm"
      animate={
        transitioning
          ? { x: -120, opacity: 0, filter: "blur(4px)" }
          : shake
          ? { x: [-10, 10, -8, 8, -4, 4, 0] }
          : { x: 0, opacity: 1, filter: "blur(0px)" }
      }
      transition={
        transitioning ? { duration: 0.45, ease: [0.22, 1, 0.36, 1] } : { duration: 0.45 }
      }
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor="username">Username</Label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <Input
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Eyad_Zidane"
            autoComplete="username"
            required
            className="pl-9"
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="current-password"
            required
            className="pl-9"
          />
        </div>
      </div>

      {error ? (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm text-vodafone-accent"
        >
          {error}
        </motion.p>
      ) : null}

      <Button type="submit" disabled={loading || transitioning} className="h-11">
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Signing in…
          </>
        ) : (
          "Sign in"
        )}
      </Button>

      <p className="text-xs text-zinc-500 text-center">
        Authorised personnel only • Vodafone Egypt
      </p>
    </motion.form>
    </>
  );
}
