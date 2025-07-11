import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { base } from "wagmi/chains";

export const config = getDefaultConfig({
  appName: "ECP Channel tool",
  projectId: "ed569a4fc1905c6af281d2789624c345", // Get from https://cloud.walletconnect.com
  chains: [base],
  ssr: false,
});
