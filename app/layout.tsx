import type { Metadata } from "next";
import { Funnel_Display, Fira_Code } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

const FunnelDisplay = Funnel_Display({
  subsets: ["latin"],
  variable: "--font-funnel-display",
  display: "swap",
});

const FiraCode = Fira_Code({
  subsets: ["latin"],
  variable: "--font-fira-code",
  display: "swap",
});

const MontechV2 = localFont({
  src: [
    {
      path: "./fonts/MONTECHV02-Medium.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "./fonts/MONTECHV02-Medium.woff",
      weight: "500",
      style: "normal",
    },
  ],
  variable: "--font-montech",
  display: "swap",
});

export const metadata: Metadata = {
  title: "sBPF Explorer",
  description: "A web-based sBPF program explorer and visualizer.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${FunnelDisplay.variable} ${MontechV2.variable} ${FiraCode.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
