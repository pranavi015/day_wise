import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });

export const metadata: Metadata = {
  title: "Daywise — Your daily learning, structured.",
  description: "Turn any learning goal into a concrete daily plan.",
};

import CommandPalette from "@/components/CommandPalette";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        <CommandPalette />
      </body>
    </html>
  );
}
