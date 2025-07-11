import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import { Navigation } from "@/components/ui/navigation";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "ECP Channel tool",
    template: "%s - ECP Channel tool",
  },
  description:
    "Create and manage channels on the Ethereum Comments Protocol. Build decentralized communication channels with ease.",
  keywords: [
    "ethereum",
    "comments",
    "protocol",
    "channels",
    "decentralized",
    "web3",
  ],
  authors: [{ name: "ECP Channel tool" }],
  creator: "ECP Channel tool",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://channel-maker.vercel.app",
    siteName: "ECP Channel tool",
    title: "ECP Channel tool - Create Channels on Ethereum Comments Protocol",
    description:
      "Create and manage channels on the Ethereum Comments Protocol. Build decentralized communication channels with ease.",
  },
  twitter: {
    card: "summary_large_image",
    title: "ECP Channel tool - Create Channels on Ethereum Comments Protocol",
    description:
      "Create and manage channels on the Ethereum Comments Protocol. Build decentralized communication channels with ease.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          <Navigation />
          {children}
        </Providers>
      </body>
    </html>
  );
}
