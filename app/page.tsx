import type { Metadata } from "next";
import ChannelsList from "@/components/ChannelsList";

export const metadata: Metadata = {
  title: "ECP Channel tool - Create Channels on Ethereum Comments Protocol",
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
  openGraph: {
    title: "ECP Channel tool - Create Channels on Ethereum Comments Protocol",
    description:
      "Create and manage channels on the Ethereum Comments Protocol. Build decentralized communication channels with ease.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ECP Channel tool - Create Channels on Ethereum Comments Protocol",
    description:
      "Create and manage channels on the Ethereum Comments Protocol. Build decentralized communication channels with ease.",
  },
};

export default function Home() {
  return (
    <div className="gap-16 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-[32px] items-center sm:items-start max-w-5xl mx-auto">
        <div className="w-full">
          <ChannelsList />
        </div>
      </main>
    </div>
  );
}
