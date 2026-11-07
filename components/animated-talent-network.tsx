"use client";

import { motion } from "framer-motion";
import { Antenna, Radio, Server, Signal, Wifi } from "lucide-react";

const slowOrbit = {
  duration: 22,
  repeat: Infinity,
  ease: "linear" as const,
};

export function AnimatedTalentNetwork() {
  return (
    <div
      aria-hidden="true"
      className="relative flex h-full min-h-[260px] items-center justify-center overflow-hidden bg-gradient-to-br from-[#050005] via-[#160008] to-[#2a0010] px-6 py-8 text-white"
    >
      {/* Ambient premium backdrop */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(230,0,0,0.34),transparent_34%),radial-gradient(circle_at_80%_72%,rgba(255,100,100,0.18),transparent_30%)]" />
      <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:46px_46px]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,0.1),rgba(0,0,0,0.45))]" />

      {/* Rotating connection ring */}
      <motion.div
        className="absolute h-[360px] w-[360px] rounded-full border border-white/10"
        animate={{ rotate: 360 }}
        transition={slowOrbit}
      />
      <motion.div
        className="absolute h-[280px] w-[280px] rounded-full border border-vodafone-red/35"
        animate={{ rotate: -360 }}
        transition={{ ...slowOrbit, duration: 15 }}
      />

      {/* Central signal tower */}
      <div className="relative z-10 flex flex-col items-center">
        <motion.div
          className="relative flex h-24 w-24 items-center justify-center rounded-[30px] border border-white/20 bg-white/10 shadow-[0_20px_60px_-15px_rgba(230,0,0,0.6)] backdrop-blur-xl"
          animate={{ scale: [1, 1.04, 1] }}
          transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
        >
          <Antenna className="h-10 w-10 text-vodafone-red" strokeWidth={1.7} />
          <motion.span
            className="absolute -inset-4 rounded-[40px] border border-vodafone-red/40"
            animate={{ scale: [1, 1.35], opacity: [0.75, 0] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeOut" }}
          />
        </motion.div>
        <div className="mt-5 rounded-full border border-white/15 bg-white/8 px-4 py-2 backdrop-blur-md">
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-red-200/90">
            Vodafone 5G core
          </p>
        </div>
      </div>

      {/* Orbiting nodes */}
      {[
        { Icon: Signal, top: "18%", left: "16%", delay: 0, label: "Radio" },
        { Icon: Wifi, top: "24%", right: "15%", delay: 0.7, label: "Wi-Fi" },
        { Icon: Server, bottom: "22%", left: "20%", delay: 1.2, label: "Core" },
        { Icon: Radio, bottom: "18%", right: "18%", delay: 1.8, label: "Signal" },
      ].map(({ Icon, top, left, right, bottom, delay, label }) => (
        <motion.div
          key={label}
          style={{ top, left, right, bottom }}
          className="absolute flex flex-col items-center gap-2"
          animate={{ y: [0, -12, 0] }}
          transition={{ duration: 4.6, repeat: Infinity, ease: "easeInOut", delay }}
        >
          <motion.div
            className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-red-100 shadow-[0_12px_30px_-12px_rgba(230,0,0,0.5)] backdrop-blur-md"
            animate={{ rotate: [0, 6, -6, 0] }}
            transition={{ duration: 6.2, repeat: Infinity, ease: "easeInOut", delay }}
          >
            <Icon className="h-5 w-5" />
          </motion.div>
          <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-white/65">
            {label}
          </span>
        </motion.div>
      ))}

      {/* Animated data packets on ring */}
      {[0, 1, 2, 3].map((i) => (
        <motion.div
          key={`packet-${i}`}
          className="absolute h-2 w-2 rounded-full bg-red-300 shadow-[0_0_12px_4px_rgba(255,120,120,0.8)]"
          animate={{ rotate: 360 }}
          transition={{
            duration: 10 + i * 1.5,
            repeat: Infinity,
            ease: "linear",
            delay: i * 0.4,
          }}
          style={{ transformOrigin: "180px 180px" }}
        >
          <span className="absolute -inset-2 block rounded-full bg-red-300/20 blur-md" />
        </motion.div>
      ))}

      {/* Live metrics footer */}
      <div className="absolute bottom-7 left-7 right-7">
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Uptime", value: "99.98%" },
            { label: "Latency", value: "12 ms" },
            { label: "5G nodes", value: "Live" },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="rounded-xl border border-white/12 bg-white/[0.08] px-3 py-2 backdrop-blur-md"
            >
              <p className="text-[10px] uppercase tracking-[0.18em] text-white/55">{label}</p>
              <motion.p
                className="mt-1 text-sm font-semibold text-red-100"
                animate={{ opacity: [0.65, 1, 0.65] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
              >
                {value}
              </motion.p>
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-white/50">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
          </span>
          Live telecom network
        </div>
      </div>
    </div>
  );
}