import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { base } from "wagmi/chains";

export const config = getDefaultConfig({
  appName: "ECP Channel tool",
  projectId: "97a1ef18f472442c33d8858a9a5c40bd", // Get from https://cloud.walletconnect.com
  chains: [base],
  ssr: false,
});
