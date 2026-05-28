import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RealMe by ZP",
  description: "친구들이 보는 진짜 나의 MBTI",
  openGraph: {
    title: "RealMe by ZP",
    description: "친구들이 보는 진짜 나의 MBTI",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className="h-full">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
