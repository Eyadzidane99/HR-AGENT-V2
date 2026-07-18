import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vodafone Candidate Process Filtration",
  description: "Vodafone Egypt Candidate Process Filtration — chat-powered candidate intake and search.",
  icons: { icon: "/favicon.ico" }
};

export const viewport: Viewport = {
  themeColor: "#FFFFFF",
  width: "device-width",
  initialScale: 1
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-zinc-900">{children}</body>
    </html>
  );
}
