"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, Check, LockKeyhole, Sparkles } from "lucide-react";

type Props = { onComplete: () => void };

const NAVIGATION_DELAY = 3000;
const EASE = [0.16, 1, 0.3, 1] as const;

export function NetworkTransition({ onComplete }: Props) {
  const [phase, setPhase] = useState<"securing" | "syncing" | "ready">("securing");
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (reducedMotion) {
      const timeout = setTimeout(onComplete, 350);
      return () => clearTimeout(timeout);
    }

    const timers = [
      setTimeout(() => setPhase("syncing"), 850),
      setTimeout(() => setPhase("ready"), 2050),
      setTimeout(onComplete, NAVIGATION_DELAY)
    ];
    return () => timers.forEach(clearTimeout);
  }, [onComplete, reducedMotion]);

  const ready = phase === "ready";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.04, filter: "blur(10px)" }}
      transition={{ duration: 0.45, ease: EASE }}
      className="fixed inset-0 z-[200] overflow-hidden bg-[#f7f8fa] text-zinc-900 dark:bg-[#08090b] dark:text-white"
      role="status"
      aria-live="polite"
      aria-label="Opening secure workspace"
    >
      <Atmosphere reducedMotion={Boolean(reducedMotion)} />

      <header className="absolute left-6 right-6 top-6 z-20 flex items-center justify-between sm:left-10 sm:right-10 sm:top-8">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-vodafone-red text-white shadow-[0_10px_30px_-10px_rgba(230,0,0,0.8)]">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <p className="text-xs font-semibold tracking-[0.08em]">CANDIDATE INTELLIGENCE</p>
            <p className="mt-0.5 text-[9px] uppercase tracking-[0.24em] text-zinc-500 dark:text-white/40">Vodafone Egypt</p>
          </div>
        </div>
        <div className="hidden items-center gap-2 rounded-full border border-zinc-200 bg-white/60 px-3 py-2 text-[9px] font-semibold uppercase tracking-[0.2em] text-zinc-500 backdrop-blur-md dark:border-white/10 dark:bg-white/[0.04] dark:text-white/45 sm:flex">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.8)]" />
          Private session
        </div>
      </header>

      <div className="relative z-10 flex min-h-full items-center justify-center px-5 py-24">
        <div className="relative flex w-full max-w-[720px] flex-col items-center">
          <Portal reducedMotion={Boolean(reducedMotion)} ready={ready} />

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.7, ease: EASE }}
            className="mt-8 w-full max-w-[520px] text-center"
          >
            <p className="text-[10px] font-semibold uppercase tracking-[0.34em] text-vodafone-red/80">{ready ? "Access granted" : "Secure workspace"}</p>
            <h1 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-zinc-900 dark:text-white sm:text-3xl">{ready ? "Your pipeline is ready." : phase === "syncing" ? "Connecting your intelligence layer." : "Verifying your secure session."}</h1>
            <p className="mx-auto mt-3 max-w-[380px] text-sm leading-6 text-zinc-500 dark:text-white/45">{ready ? "Taking you to the candidate workspace now." : "A protected handoff is being prepared for your candidate data."}</p>
          </motion.div>

          <Telemetry phase={phase} />
        </div>
      </div>

      <div className="absolute bottom-7 left-6 right-6 flex items-center justify-between text-[9px] uppercase tracking-[0.22em] text-zinc-400 dark:text-white/30 sm:left-10 sm:right-10">
        <span>SESSION 04A7 • AES-256</span>
        <span className="flex items-center gap-1.5 text-vodafone-red">Enter workspace <ArrowUpRight className="h-3 w-3" /></span>
      </div>
    </motion.div>
  );
}

function Atmosphere({ reducedMotion }: { reducedMotion: boolean }) {
  const particles = Array.from({ length: 16 });
  return (
    <>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,rgba(230,0,0,0.12),transparent_23%),radial-gradient(circle_at_82%_80%,rgba(230,0,0,0.08),transparent_25%)] dark:bg-[radial-gradient(circle_at_50%_42%,rgba(230,0,0,0.22),transparent_23%),radial-gradient(circle_at_82%_80%,rgba(230,0,0,0.13),transparent_25%)]" />
      <div className="absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(15,23,42,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.04)_1px,transparent_1px)] [background-size:64px_64px] dark:opacity-20 dark:[background-image:linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)]" />
      {!reducedMotion ? (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {particles.map((_, index) => (
            <motion.span
              key={index}
              className="absolute h-px rounded-full bg-gradient-to-r from-transparent via-vodafone-red/50 to-transparent dark:via-vodafone-red/70"
              style={{ top: `${8 + ((index * 19) % 82)}%`, width: `${80 + (index % 4) * 55}px` }}
              initial={{ x: "-24vw", opacity: 0 }}
              animate={{ x: "124vw", opacity: [0, 0.55, 0] }}
              transition={{ duration: 3.4 + (index % 3) * 0.7, delay: index * 0.13, repeat: Infinity, ease: "linear" }}
            />
          ))}
        </div>
      ) : null}
    </>
  );
}

function Portal({ reducedMotion, ready }: { reducedMotion: boolean; ready: boolean }) {
  return (
    <div className="relative flex h-[260px] w-[260px] items-center justify-center sm:h-[300px] sm:w-[300px]">
      <motion.div
        className="absolute inset-0 rounded-full border border-vodafone-red/15 dark:border-vodafone-red/30"
        animate={reducedMotion ? undefined : { rotate: 360 }}
        transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
      />
      <motion.div
        className="absolute inset-7 rounded-full border border-dashed border-vodafone-red/20 dark:border-white/15"
        animate={reducedMotion ? undefined : { rotate: -360 }}
        transition={{ duration: 13, repeat: Infinity, ease: "linear" }}
      />
      <motion.div
        className="absolute inset-16 rounded-full border border-vodafone-red/25 dark:border-vodafone-red/40"
        animate={reducedMotion ? undefined : { scale: [0.92, 1.08, 0.92], opacity: [0.45, 0.9, 0.45] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute h-44 w-44 rounded-full bg-vodafone-red/10 blur-3xl dark:bg-vodafone-red/25"
        animate={reducedMotion ? undefined : { scale: [0.8, 1.12, 0.8], opacity: [0.4, 0.9, 0.4] }}
        transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.div
        className="relative flex h-28 w-28 items-center justify-center rounded-[34px] border border-vodafone-red/20 bg-white/70 shadow-[0_18px_70px_-18px_rgba(230,0,0,0.72)] backdrop-blur-xl dark:border-white/15 dark:bg-[#171014]"
        animate={reducedMotion ? undefined : { y: [0, -6, 0] }}
        transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="absolute inset-2 rounded-[28px] border border-vodafone-red/10 dark:border-white/[0.08]" />
        <LockKeyhole className="h-10 w-10 text-vodafone-red" strokeWidth={1.35} />
        {ready ? (
          <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-500/30">
            <Check className="h-4 w-4" strokeWidth={3} />
          </motion.span>
        ) : null}
      </motion.div>

      <motion.div
        className="absolute left-1/2 top-1/2 h-px w-[340px] -translate-x-1/2 bg-gradient-to-r from-transparent via-vodafone-red/60 to-transparent"
        initial={{ scaleX: 0, opacity: 0 }}
        animate={{ scaleX: ready ? 1.3 : 1, opacity: ready ? 0.3 : 0.75 }}
        transition={{ duration: 0.9, ease: EASE }}
      />
    </div>
  );
}

function Telemetry({ phase }: { phase: "securing" | "syncing" | "ready" }) {
  const items = [
    ["Signal", phase === "securing" ? "AUTHENTICATING" : "STABLE"],
    ["Latency", phase === "ready" ? "12 ms" : "— —"],
    ["Region", "EG · CAI"]
  ];
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7, duration: 0.5 }} className="mt-9 grid w-full max-w-[520px] grid-cols-3 divide-x divide-zinc-200/80 rounded-2xl border border-zinc-200/80 bg-white/55 px-2 py-4 backdrop-blur-xl dark:divide-white/10 dark:border-white/10 dark:bg-white/[0.04]">
      {items.map(([label, value]) => (
        <div key={label} className="px-3 text-center">
          <p className="text-[9px] uppercase tracking-[0.18em] text-zinc-400 dark:text-white/30">{label}</p>
          <p className="mt-1.5 text-[10px] font-semibold tracking-[0.12em] text-zinc-700 dark:text-white/70">{value}</p>
        </div>
      ))}
    </motion.div>
  );
}
