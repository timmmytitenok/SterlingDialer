import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sterling Dialer",
  description: "Turn old life insurance leads into booked appointments automatically. AI-powered calling for life insurance agents.",
  viewport: "width=device-width, initial-scale=1, maximum-scale=5",
  themeColor: "#0B1437",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased overscroll-none`}
      >
        {children}
      </body>
    </html>
  );
}
