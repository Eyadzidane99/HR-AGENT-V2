"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Lock, ShieldCheck } from "lucide-react";

type Props = {
  onComplete: () => void;
};

const CHIP_CONTACTS = 6;
// Total time before we hand off to the chat route.
const NAV_AT_MS = 3100;

const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;
const EASE_OUT_QUART = [0.22, 1, 0.36, 1] as const;

export function NetworkTransition({ onComplete }: Props) {
  const [chipPhase, setChipPhase] = useState(0);
  const [showRail, setShowRail] = useState(false);
  const [docked, setDocked] = useState(false);
  const [showSignal, setShowSignal] = useState(false);
  const [showRings, setShowRings] = useState(false);
  const [showConnected, setShowConnected] = useState(false);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const t: ReturnType<typeof setTimeout>[] = [];
    t.push(setTimeout(() => setShowRail(true), 200));
    t.push(setTimeout(() => setDocked(true), 1100));
    for (let i = 1; i <= CHIP_CONTACTS; i++) {
      t.push(setTimeout(() => setChipPhase(i), 1200 + i * 90));
    }
    t.push(setTimeout(() => setShowSignal(true), 1850));
    t.push(setTimeout(() => setShowRings(true), 2050));
    t.push(setTimeout(() => setShowConnected(true), 2350));
    t.push(setTimeout(() => setExiting(true), 2750));
    t.push(setTimeout(() => onComplete(), NAV_AT_MS));
    return () => t.forEach(clearTimeout);
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
      className="fixed inset-0 z-[200] overflow-hidden bg-black"
    >
      {/* Background glow + slow rotating ring (depth) */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(230,0,0,0.18),transparent_60%)]" />
      <motion.div
        className="absolute left-1/2 top-1/2 h-[140vmin] w-[140vmin] -translate-x-1/2 -translate-y-1/2 rounded-full border border-vodafone-red/10"
        animate={{ rotate: 360 }}
        transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
      />

      {/* Speed lines — parallax data streaks moving horizontally */}
      <SpeedLines />

      {/* Streaming data packets across the rail */}
      <DataPackets active={showRail && !exiting} />

      {/* Horizontal rail */}
      <AnimatePresence>
        {showRail ? (
          <motion.div
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{
              scaleX: 1,
              opacity: exiting ? 0 : 1
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.55, ease: EASE_OUT_QUART }}
            style={{ transformOrigin: "left center" }}
            className="absolute left-0 right-0 top-1/2 h-px -translate-y-px bg-gradient-to-r from-transparent via-vodafone-red/60 to-transparent"
          />
        ) : null}
      </AnimatePresence>

      {/* Tick marks along the rail */}
      <AnimatePresence>
        {showRail && !exiting ? <RailTicks /> : null}
      </AnimatePresence>

      {/* Page-exit blade — sweeps left-to-right at the end */}
      <AnimatePresence>
        {exiting ? (
          <motion.div
            initial={{ x: "-110%" }}
            animate={{ x: "110%" }}
            transition={{ duration: 0.7, ease: EASE_OUT_EXPO }}
            className="pointer-events-none absolute inset-y-0 left-0 w-[55vw] -skew-x-[14deg] bg-gradient-to-r from-transparent via-vodafone-red/40 to-vodafone-red/0 mix-blend-screen"
          />
        ) : null}
      </AnimatePresence>

      {/* Stage: SIM card travels in horizontally → docks → exits left */}
      <motion.div
        initial={{ x: "55vw", opacity: 0, scale: 0.85, rotate: -4 }}
        animate={
          exiting
            ? { x: "-130vw", opacity: 0, scale: 0.95, rotate: -8 }
            : docked
            ? { x: 0, opacity: 1, scale: 1, rotate: 0 }
            : { x: 0, opacity: 1, scale: 1, rotate: 0 }
        }
        transition={
          exiting
            ? { duration: 0.7, ease: EASE_OUT_EXPO }
            : { duration: 1.05, ease: EASE_OUT_EXPO }
        }
        className="absolute left-1/2 top-1/2 z-10 flex -translate-x-1/2 -translate-y-1/2 items-center gap-12"
      >
        <SimCard chipPhase={chipPhase} />
        <AnimatePresence>{showSignal ? <SignalBars /> : null}</AnimatePresence>
      </motion.div>

      {/* Concentric router pulse rings emanating from SIM */}
      <AnimatePresence>
        {showRings && !exiting ? (
          <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            {[0, 0.45, 0.9].map((delay, i) => (
              <motion.span
                key={i}
                initial={{ scale: 0.5, opacity: 0.65 }}
                animate={{ scale: 5.2, opacity: 0 }}
                transition={{ delay, duration: 1.8, ease: "easeOut", repeat: Infinity }}
                className="absolute -left-24 -top-24 h-48 w-48 rounded-full border-2 border-vodafone-red"
              />
            ))}
          </div>
        ) : null}
      </AnimatePresence>

      {/* Top-left handshake badge */}
      <AnimatePresence>
        {docked && !exiting ? (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            className="absolute left-8 top-8 flex items-center gap-2 rounded-full border border-vodafone-red/30 bg-black/40 px-3 py-1.5 backdrop-blur"
          >
            <Lock className="h-3 w-3 text-vodafone-red" />
            <span className="text-[11px] tracking-[0.2em] text-zinc-400">
              VF-EGY • SECURE HANDSHAKE
            </span>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* Bottom-right session badge */}
      <AnimatePresence>
        {showConnected && !exiting ? (
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            className="absolute bottom-8 right-8 flex items-center gap-2 rounded-full border border-vodafone-red/30 bg-black/40 px-3 py-1.5 backdrop-blur"
          >
            <ShieldCheck className="h-3 w-3 text-vodafone-red" />
            <span className="text-[11px] tracking-[0.2em] text-zinc-400">
              SESSION ESTABLISHED
            </span>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* Status line bottom-center */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: exiting ? 0 : 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.4 }}
        className="absolute bottom-[14%] left-1/2 z-20 flex -translate-x-1/2 flex-col items-center gap-3 text-center"
      >
        <div className="flex h-6 items-center gap-2 text-sm tracking-wide text-zinc-300">
          <AnimatePresence mode="wait">
            {!showConnected ? (
              <motion.span
                key="connecting"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
                className="flex items-center gap-2.5"
              >
                <span className="h-2 w-2 rounded-full bg-vodafone-red animate-pulse-red" />
                Establishing 5G channel…
              </motion.span>
            ) : (
              <motion.span
                key="connected"
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 16 }}
                className="flex items-center gap-2.5 text-white"
              >
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-vodafone-red shadow-[0_0_14px_rgba(230,0,0,0.85)]">
                  <Check className="h-3 w-3 text-white" strokeWidth={3} />
                </span>
                Connected • 5G Ultra
              </motion.span>
            )}
          </AnimatePresence>
        </div>
        <p className="text-[10px] uppercase tracking-[0.32em] text-zinc-600">
          Vodafone Egypt • Secure Channel
        </p>
      </motion.div>
    </motion.div>
  );
}

/* ------------------------------ subcomponents ----------------------------- */

function SpeedLines() {
  // Horizontal streaks at varied speeds & y-positions for parallax depth.
  const lines = Array.from({ length: 14 }).map((_, i) => ({
    top: 6 + ((i * 11) % 88),
    width: 80 + (i % 5) * 60,
    delay: (i % 7) * 0.18,
    duration: 1.4 + (i % 4) * 0.4,
    opacity: 0.18 + (i % 3) * 0.18
  }));
  return (
    <div className="pointer-events-none absolute inset-0">
      {lines.map((l, i) => (
        <motion.span
          key={i}
          initial={{ x: "-30vw", opacity: 0 }}
          animate={{ x: "130vw", opacity: [0, l.opacity, 0] }}
          transition={{
            duration: l.duration,
            delay: l.delay,
            repeat: Infinity,
            ease: "linear"
          }}
          style={{ top: `${l.top}%`, width: `${l.width}px` }}
          className="absolute h-px bg-gradient-to-r from-transparent via-vodafone-red/70 to-transparent blur-[0.5px]"
        />
      ))}
    </div>
  );
}

function DataPackets({ active }: { active: boolean }) {
  if (!active) return null;
  const packets = Array.from({ length: 9 }).map((_, i) => ({
    top: 48 + ((i * 13) % 5) - 2,
    delay: i * 0.22,
    duration: 1.6 + (i % 3) * 0.3
  }));
  return (
    <div className="pointer-events-none absolute inset-0">
      {packets.map((p, i) => (
        <motion.span
          key={i}
          initial={{ x: "-10vw", opacity: 0 }}
          animate={{
            x: "110vw",
            opacity: [0, 1, 1, 0]
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: "linear",
            times: [0, 0.15, 0.85, 1]
          }}
          style={{ top: `${p.top}%` }}
          className="absolute h-1.5 w-2 rounded-full bg-vodafone-red shadow-[0_0_10px_rgba(230,0,0,0.9)]"
        />
      ))}
    </div>
  );
}

function RailTicks() {
  const positions = [8, 18, 28, 38, 48, 58, 68, 78, 88];
  return (
    <div className="pointer-events-none absolute left-0 right-0 top-1/2 -translate-y-1/2">
      {positions.map((p, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, scaleY: 0 }}
          animate={{ opacity: 0.6, scaleY: 1 }}
          transition={{ delay: 0.15 + i * 0.04, duration: 0.3 }}
          style={{ left: `${p}%` }}
          className="absolute top-1/2 -translate-y-1/2 block h-2 w-px bg-vodafone-red/40"
        />
      ))}
    </div>
  );
}

function SimCard({ chipPhase }: { chipPhase: number }) {
  const contacts: [number, number, number, number][] = [
    [34, 50, 30, 22],
    [76, 50, 30, 22],
    [34, 76, 30, 22],
    [76, 76, 30, 22],
    [34, 102, 30, 22],
    [76, 102, 30, 22]
  ];

  return (
    <svg
      width="180"
      height="220"
      viewBox="0 0 140 175"
      className="drop-shadow-[0_0_45px_rgba(230,0,0,0.5)]"
    >
      <defs>
        <linearGradient id="sim-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1a1a1a" />
          <stop offset="100%" stopColor="#070707" />
        </linearGradient>
        <linearGradient id="chip-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1d1d1d" />
          <stop offset="100%" stopColor="#0d0d0d" />
        </linearGradient>
        <radialGradient id="vf-mark" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#FF5050" />
          <stop offset="100%" stopColor="#990000" />
        </radialGradient>
        <filter id="contact-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1.6" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <path
        d="M22 2 L118 2 L138 22 L138 173 L2 173 L2 22 Z"
        fill="url(#sim-body)"
        stroke="#E60000"
        strokeOpacity="0.55"
        strokeWidth="1.5"
      />

      <g opacity="0.08">
        {Array.from({ length: 14 }).map((_, i) => (
          <line
            key={i}
            x1="2"
            y1={6 + i * 12}
            x2="138"
            y2={6 + i * 12}
            stroke="#fff"
            strokeWidth="0.4"
          />
        ))}
      </g>

      <circle cx="22" cy="155" r="9" fill="url(#vf-mark)" />
      <path
        d="M22 149 a6 6 0 0 0 -6 6 a6 6 0 0 0 4 5.6 c -0.04 -0.4 -0.06 -0.8 -0.06 -1.2 c 0 -2.4 1.9 -4.4 4.3 -4.55 q 0.1 0 0.2 0 c -1.5 -0.5 -2.5 -1.9 -2.5 -3.5 q 0 -0.15 0.02 -0.3 a 6 6 0 0 0 -0.06 0 z"
        fill="#fff"
      />

      <rect
        x="28"
        y="46"
        width="84"
        height="86"
        rx="6"
        fill="url(#chip-bg)"
        stroke="#E60000"
        strokeOpacity="0.35"
        strokeWidth="0.6"
      />

      {contacts.map(([x, y, w, h], i) => {
        const lit = i < chipPhase;
        return (
          <motion.rect
            key={i}
            x={x}
            y={y}
            width={w}
            height={h}
            rx="2"
            initial={{ fill: "#1f1f1f" }}
            animate={{ fill: lit ? "#E60000" : "#1f1f1f" }}
            transition={{ duration: 0.25 }}
            filter={lit ? "url(#contact-glow)" : undefined}
          />
        );
      })}

      <line
        x1="28"
        y1="89"
        x2="112"
        y2="89"
        stroke="#E60000"
        strokeOpacity="0.25"
        strokeWidth="0.5"
      />
      <line
        x1="70"
        y1="46"
        x2="70"
        y2="132"
        stroke="#E60000"
        strokeOpacity="0.25"
        strokeWidth="0.5"
      />

      <circle cx="120" cy="156" r="1.6" fill="#E60000" opacity="0.7" />
      <text x="98" y="160" fontSize="6" fill="#E60000" opacity="0.55" fontFamily="monospace">
        VF-EGY
      </text>
    </svg>
  );
}

function SignalBars() {
  const heights = [10, 20, 32, 46, 60];
  return (
    <motion.div
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4, ease: EASE_OUT_QUART }}
      className="flex flex-col items-center gap-3"
    >
      <div className="flex items-end gap-1.5">
        {heights.map((h, i) => (
          <motion.span
            key={i}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: h, opacity: 1 }}
            transition={{ delay: 0.05 + i * 0.11, duration: 0.32, ease: "easeOut" }}
            className="block w-2.5 rounded-sm bg-vodafone-red shadow-[0_0_10px_rgba(230,0,0,0.75)]"
          />
        ))}
      </div>
      <motion.div
        initial={{ opacity: 0, scale: 0.55 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.55, type: "spring", stiffness: 280, damping: 14 }}
        className="rounded-md border border-vodafone-red/60 bg-vodafone-red/15 px-2 py-0.5 text-[11px] font-bold tracking-[0.18em] text-vodafone-red shadow-[0_0_18px_-4px_rgba(230,0,0,0.6)]"
      >
        5G
      </motion.div>
    </motion.div>
  );
}
