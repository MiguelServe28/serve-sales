import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SERVE · Sales",
  description: "Cobranças, pendentes e área comercial da SERVE.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-PT">
      <body className="font-sans">{children}</body>
    </html>
  );
}
