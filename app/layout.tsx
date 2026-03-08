import type { Metadata } from "next";
import Navbar from "@/components/navbar";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FinAnalyst Pro — AI-Powered Stock Analysis",
  description:
    "FinAnalyst Pro is an AI-powered financial analyst that helps you analyze the stock market with custom AI models, delivering institutional-grade insights in seconds.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.className} ${spaceGrotesk.variable} antialiased`}
      >
        {/* Ambient background mesh */}
        <div className="bg-mesh" />

        <Navbar />

        <main className="relative z-10 pt-20">{children}</main>
      </body>
    </html>
  );
}
