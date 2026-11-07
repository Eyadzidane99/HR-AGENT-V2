"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Eye, EyeOff, Loader2, Lock, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NetworkTransition } from "@/components/network-transition";

export function LoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(0);
  const [transitioning, setTransitioning] = useState(false);
  const prefersReducedMotion = useReducedMotion();

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
      router.prefetch("/chat");
      setTransitioning(true);
    } catch (err) {
      setError("Network error. Try again.");
      setShake((s) => s + 1);
      setLoading(false);
    }
  }

  const fieldClass =
    "h-12 rounded-xl border border-zinc-300 bg-white pl-11 text-zinc-900 placeholder:text-zinc-400 focus-visible:border-red-500 focus-visible:ring-red-500/50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white dark:placeholder:text-zinc-500";

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
        onSubmit={handleSubmit}
        className="flex flex-col gap-5"
        animate={
          transitioning
            ? { x: -90, opacity: 0, filter: "blur(4px)" }
            : prefersReducedMotion
            ? { x: 0, opacity: 1, filter: "blur(0px)" }
            : shake
            ? { x: [-10, 10, -8, 8, -4, 4, 0] }
            : { x: 0, opacity: 1, filter: "blur(0px)" }
        }
        transition={
          transitioning ? { duration: 0.45, ease: [0.22, 1, 0.36, 1] } : { duration: 0.45 }
        }
      >
        <div className="flex flex-col gap-2">
          <Label htmlFor="username" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            NT Account
          </Label>
          <div className="relative">
            <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" />
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your NT account"
              autoComplete="username"
              required
              className={fieldClass}
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Password
            </Label>
          </div>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              autoComplete="current-password"
              required
              className={`${fieldClass} pr-11`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
              className="absolute right-2 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-md text-zinc-400 transition-colors hover:text-zinc-900 dark:text-zinc-500 dark:hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {error ? (
          <motion.p
            role="alert"
            aria-live="assertive"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm text-red-600 dark:text-red-400"
          >
            {error}
          </motion.p>
        ) : null}

        <Button
          type="submit"
          disabled={loading || transitioning}
          className="h-12 w-full rounded-xl bg-red-600 text-white shadow-lg shadow-red-600/25 transition-all hover:bg-red-500 disabled:opacity-60"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Signing in…
            </>
          ) : (
            "Sign in"
          )}
        </Button>

        <p className="text-center text-xs text-zinc-600">
          Authorised personnel only • Vodafone Egypt
        </p>
      </motion.form>
    </>
  );
}