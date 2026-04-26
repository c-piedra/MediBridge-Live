import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MediBridge Live — Real-Time Medical Interpreter",
  description:
    "Real-time audio transcription and translation assistant for medical interpreters. Spanish ↔ English. No data stored.",
  robots: "noindex, nofollow", // privacy-first: not indexed
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0891B2",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background antialiased">{children}</body>
    </html>
  );
}
