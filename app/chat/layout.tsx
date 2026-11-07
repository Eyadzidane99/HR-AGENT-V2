import { AnimatedBackground } from "@/components/animated-background";

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AnimatedBackground />
      {children}
    </>
  );
}
