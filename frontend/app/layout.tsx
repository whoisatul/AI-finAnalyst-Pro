import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "AI-finAnalyst Pro",
  description: "fin-analyst-ai Pro is AI-powered financial analyst which is create by hrikshesh kumar to help you to analyze the stock market and make the decision to invest in the stock market, it uses custom models to analyze the stock in last few years and give you the best analysis.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} ${spaceGrotesk.variable} antialiased bg-slate-900 text-white`}>
        <Navbar /> {/* <--- Add it here, above children */}
        
        {/* We add padding-top (pt-20) so the content isn't hidden behind the fixed navbar */}
        <main className="pt-20">
          {children}
        </main>
      </body>
    </html>
  );
}
