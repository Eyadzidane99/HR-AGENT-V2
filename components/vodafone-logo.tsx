import { cn } from "@/lib/utils";

type Props = {
  className?: string;
  size?: number;
  withWordmark?: boolean;
};

export function VodafoneLogo({ className, size = 40, withWordmark = false }: Props) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Vodafone"
      >
        <defs>
          <radialGradient id="vf-grad" cx="35%" cy="30%" r="80%">
            <stop offset="0%" stopColor="#FF5050" />
            <stop offset="60%" stopColor="#E60000" />
            <stop offset="100%" stopColor="#990000" />
          </radialGradient>
        </defs>
        <circle cx="32" cy="32" r="30" fill="url(#vf-grad)" />
        <circle cx="32" cy="32" r="30" fill="none" stroke="#fff" strokeOpacity="0.15" strokeWidth="1" />
        {/* Vodafone speech-mark / quotation */}
        <path
          d="M32 14c-9.94 0-18 7.16-18 16 0 6.43 4.42 12.08 10.62 14.32-.07-.6-.12-1.2-.12-1.82 0-7.18 5.6-13.04 12.78-13.5l.22-.01c.32 0 .64.01.95.04C36.36 23.62 33.4 19.6 33.4 14.86c0-.28.01-.56.03-.84A18.18 18.18 0 0 0 32 14Z"
          fill="#fff"
        />
      </svg>
      {withWordmark ? (
        <span className="text-white font-semibold tracking-wide text-lg">
          Vodafone <span className="text-vodafone-red">HR</span>
        </span>
      ) : null}
    </div>
  );
}
