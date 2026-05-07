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
          xmlns="http://www.w3.org/2000/svg"
          viewBox="-0.398 -4.59 378.918 388.633"
          width={size}
          height={size}
          aria-label="Vodafone"
          className="relative z-10 drop-shadow-[0_2px_14px_rgba(230,0,0,0.75)]"
          animate={animated ? { scale: [1, 1.028, 1] } : undefined}
          transition={
            animated
              ? { duration: 3.2, repeat: Infinity, ease: "easeInOut" }
              : undefined
          }
        >
          <defs>
            <radialGradient id={gradId} cx="40%" cy="26%" r="82%">
              <stop offset="0%" stopColor="#FF4444" />
              <stop offset="42%" stopColor="#E60000" />
              <stop offset="100%" stopColor="#880000" />
            </radialGradient>
          </defs>
          {/* Official Vodafone speech-mark — outer red body */}
          <path
            d="m119.441 14.328c47.465-18.918 102.754-17.61 148.954 4.363-13.165-2-26.555-.492-39.586 1.711-35.391 6.684-69.024 23.336-95.313 48.075-25.207 24.777-42.871 57.652-47.86 92.824-3.3 24.922-.241 51.062 10.942 73.746 11.524 23.8 31.809 43.32 56.258 53.394 23.559 9.97 50.887 9.86 74.75.961 35.805-13.14 61.531-48.62 64.473-86.527 1.851-24.844-4.192-51.273-20.883-70.328-15.934-18.652-39.238-28.926-62.559-34.774-1.25-23 9.586-45.722 26.77-60.68 9.543-8.605 21.386-14.09 33.633-17.6l.93-.321c35.058 16.812 64.847 44.539 83.827 78.578 16.262 28.98 24.743 62.375 23.903 95.64-.16 43.016-16.239 85.606-43.801 118.497-26.063 31.367-62.516 53.93-102.246 62.965-39.836 9.191-82.695 5.226-119.977-11.704-36.48-16.293-67.386-44.617-87.047-79.457-16.355-28.953-25.007-62.336-24.289-95.64.078-41.496 14.813-82.672 40.54-115.121 20.55-25.91 47.812-46.512 78.581-58.602z"
            fill={`url(#${gradId})`}
          />
          {/* Inner white fill */}
          <path
            d="m228.809 20.402c13.03-2.203 26.421-3.71 39.586-1.71l1.89.32-1.265.48c-12.247 3.512-24.09 8.996-33.633 17.602-17.184 14.957-28.02 37.68-26.77 60.68 23.32 5.847 46.625 16.12 62.559 34.773 16.691 19.055 22.734 45.484 20.883 70.328-2.942 37.906-28.668 73.387-64.473 86.527-23.863 8.899-51.191 9.008-74.75-.96-24.45-10.075-44.734-29.594-56.258-53.395-11.183-22.684-14.242-48.824-10.941-73.746 4.988-35.172 22.652-68.047 47.86-92.824 26.288-24.739 59.921-41.391 95.312-48.075z"
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
