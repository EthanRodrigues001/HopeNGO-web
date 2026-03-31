import type { Metadata } from "next";
import { Manrope, Newsreader } from "next/font/google";
import { Navbar } from "@/components/navbar";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const newsreader = Newsreader({
  variable: "--font-serif",
  subsets: ["latin"],
  display: "swap",
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "HopeNGO | The Living Archive",
  description: "A digital monograph of our community impact.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${manrope.variable} ${newsreader.variable} antialiased font-sans bg-background text-foreground selection:bg-primary/20 selection:text-foreground`}
      >
        <Navbar />
        {children}
      </body>
    </html>
  );
}
