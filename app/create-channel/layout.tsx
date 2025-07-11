import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create Channel - ECP Channel tool",
  description:
    "Create a new channel on the Ethereum Comments Protocol. Set up your channel name, description, and optional hook address.",
  keywords: [
    "create channel",
    "ethereum comments",
    "protocol",
    "web3",
    "decentralized",
  ],
  openGraph: {
    title: "Create Channel - ECP Channel tool",
    description:
      "Create a new channel on the Ethereum Comments Protocol. Set up your channel name, description, and optional hook address.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Create Channel - ECP Channel tool",
    description:
      "Create a new channel on the Ethereum Comments Protocol. Set up your channel name, description, and optional hook address.",
  },
};

export default function CreateChannelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
