"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NetworkTransition } from "@/components/network-transition";

export function LoginForm() {
  const router = useRouter();
  const usernameRef = useRef<HTMLInputElement>(null);
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

  useEffect(() => {
    if (shake > 0 && !transitioning) {
      usernameRef.current?.focus();
    }
  }, [shake, transitioning]);

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

  const shakeAnimation = prefersReducedMotion
    ? { x: 0 }
    : { x: shake ? [-10, 10, -8, 8, -4, 4, 0] : 0 };

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
            ? { x: -80, opacity: 0, filter: "blur(4px)" }
            : { ...shakeAnimation, opacity: 1, filter: "blur(0px)" }
        }
        transition={
          transitioning ? { duration: 0.45, ease: [0.22, 1, 0.36, 1] } : { duration: 0.45 }
        }
      >
        <div className="flex flex-col gap-2">
          <Label htmlFor="username" className="text-zinc-600 dark:text-zinc-500 dark:text-[#A0A0A0]">
            Work Email
          </Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 dark:text-[#A0A0A0]" />
            <Input
              id="username"
              ref={usernameRef}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your NT account"
              autoComplete="username"
              required
              className="h-[50px] rounded-[10px] border-zinc-300 bg-white pl-10 text-zinc-900 placeholder:text-zinc-400 focus-visible:border-vodafone-red focus-visible:ring-vodafone-red/60 dark:border-[#414141] dark:bg-[#171717] dark:text-white dark:placeholder:text-[#737373]"
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="password" className="text-zinc-600 dark:text-zinc-500 dark:text-[#A0A0A0]">
            Password
          </Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 dark:text-[#A0A0A0]" />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              autoComplete="current-password"
              required
              className="h-[50px] rounded-[10px] border-zinc-300 bg-white pl-10 pr-10 text-zinc-900 placeholder:text-zinc-400 focus-visible:border-vodafone-red focus-visible:ring-vodafone-red/60 dark:border-[#414141] dark:bg-[#171717] dark:text-white dark:placeholder:text-[#737373]"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
              className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex h-9 w-9 items-center justify-center rounded-md text-[#A0A0A0] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vodafone-red/60"
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
            className="text-sm text-vodafone-accent"
          >
            {error}. Please check your credentials and try again.
          </motion.p>
        ) : null}

        <Button
          type="submit"
          disabled={loading || transitioning}
          className="h-[50px] w-full rounded-[10px] bg-vodafone-red text-white shadow-[0_14px_32px_-12px_rgba(230,0,0,0.7)] transition-all hover:bg-vodafone-deep hover:shadow-[0_18px_36px_-12px_rgba(230,0,0,0.75)] active:scale-[0.99]"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Signing in…
            </>
          ) : (
            "Sign In"
          )}
        </Button>
      </motion.form>
    </>
  );
}