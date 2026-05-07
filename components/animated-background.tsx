"use client";

import { motion } from "framer-motion";

export function AnimatedBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-black">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(230,0,0,0.18),transparent_55%),radial-gradient(ellipse_at_bottom_right,_rgba(153,0,0,0.18),transparent_55%)]" />
      <motion.div
        className="absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-vodafone-red/30 blur-3xl"
        animate={{ x: [0, 60, -30, 0], y: [0, 40, -50, 0], scale: [1, 1.1, 0.95, 1] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -bottom-32 -right-32 h-[420px] w-[420px] rounded-full bg-vodafone-deep/40 blur-3xl"
        animate={{ x: [0, -50, 40, 0], y: [0, -30, 60, 0], scale: [1, 0.9, 1.1, 1] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute top-1/2 left-1/3 h-[300px] w-[300px] rounded-full bg-vodafone-accent/15 blur-3xl"
        animate={{ x: [0, 40, -60, 0], y: [0, -50, 30, 0] }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.55)_70%,#000_100%)]" />
      <div className="absolute inset-0 opacity-[0.04] mix-blend-overlay [background-image:repeating-linear-gradient(90deg,#fff_0_1px,transparent_1px_4px)]" />
    </div>
  );
}
