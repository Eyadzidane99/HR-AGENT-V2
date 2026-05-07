"use client";

import { useId } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
  size?: number;
  withWordmark?: boolean;
  animated?: boolean;
};

export function VodafoneLogo({
  className,
  size = 40,
  withWordmark = false,
  animated = true,
}: Props) {
  const uid = useId();
  const gradId = `vf-grad-${uid}`;
  const glassId = `vf-glass-${uid}`;

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        {/* Pulse ring 1 */}
        {animated && (
          <motion.span
            className="absolute inset-0 rounded-full bg-vodafone-red"
            style={{ display: "block" }}
            animate={{ scale: [1, 1.65, 1.65], opacity: [0.55, 0, 0] }}
            transition={{
              duration: 2.4,
              repeat: Infinity,
              ease: "easeOut",
              repeatDelay: 0.2,
            }}
          />
        )}
        {/* Pulse ring 2 (staggered) */}
        {animated && (
          <motion.span
            className="absolute inset-0 rounded-full bg-vodafone-red"
            style={{ display: "block" }}
            animate={{ scale: [1, 1.65, 1.65], opacity: [0.4, 0, 0] }}
            transition={{
              duration: 2.4,
              repeat: Infinity,
              ease: "easeOut",
              delay: 1.2,
              repeatDelay: 0.2,
            }}
          />
        )}

        <motion.svg
          width={size}
          height={size}
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-label="Vodafone"
          className="relative z-10 drop-shadow-[0_2px_10px_rgba(230,0,0,0.65)]"
          animate={animated ? { scale: [1, 1.028, 1] } : undefined}
          transition={
            animated
              ? { duration: 3.2, repeat: Infinity, ease: "easeInOut" }
              : undefined
          }
        >
          <defs>
            {/* Main red gradient — richer depth */}
            <radialGradient id={gradId} cx="40%" cy="26%" r="82%">
              <stop offset="0%" stopColor="#FF4444" />
              <stop offset="42%" stopColor="#E60000" />
              <stop offset="100%" stopColor="#880000" />
            </radialGradient>
            {/* Glass-dome highlight */}
            <radialGradient id={glassId} cx="36%" cy="18%" r="58%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.28)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0)" />
            </radialGradient>
          </defs>

          {/* Subtle shadow base */}
          <ellipse cx="32" cy="36" rx="26" ry="6" fill="rgba(0,0,0,0.25)" />

          {/* Main circle */}
          <circle cx="32" cy="32" r="30" fill={`url(#${gradId})`} />

          {/* Glass dome highlight */}
          <circle cx="32" cy="32" r="30" fill={`url(#${glassId})`} />

          {/* Rim */}
          <circle
            cx="32"
            cy="32"
            r="29.5"
            fill="none"
            stroke="rgba(255,255,255,0.18)"
            strokeWidth="0.8"
          />

          {/* Vodafone speech-mark */}
          <path
            d="M32 14c-9.94 0-18 7.16-18 16 0 6.43 4.42 12.08 10.62 14.32
               -.07-.6-.12-1.2-.12-1.82 0-7.18 5.6-13.04 12.78-13.5
               l.22-.01c.32 0 .64.01.95.04
               C36.36 23.62 33.4 19.6 33.4 14.86
               c0-.28.01-.56.03-.84A18.18 18.18 0 0 0 32 14Z"
            fill="white"
          />
        </motion.svg>
      </div>

      {withWordmark && (
        <motion.span
          className="text-white font-semibold tracking-wide text-lg select-none"
          initial={animated ? { opacity: 0, x: -8 } : undefined}
          animate={animated ? { opacity: 1, x: 0 } : undefined}
          transition={
            animated
              ? { delay: 0.25, duration: 0.5, ease: [0.22, 1, 0.36, 1] }
              : undefined
          }
        >
          Vodafone <span className="text-vodafone-red">HR</span>
        </motion.span>
      )}
    </div>
  );
}
