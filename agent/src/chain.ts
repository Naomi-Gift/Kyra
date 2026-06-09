import {
  createPublicClient,
  createWalletClient,
  http,
  defineChain,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { config } from "./config.js";

// Celo mainnet chain definition (viem doesn't include it by default)
export const celo = defineChain({
  id:   42220,
  name: "Celo",
  nativeCurrency: { name: "CELO", symbol: "CELO", decimals: 18 },
  rpcUrls: {
    default: { http: [config.rpcUrl] },
    public:  { http: ["https://forno.celo.org"] },
  },
  blockExplorers: {
    default: { name: "Celoscan", url: "https://celoscan.io" },
  },
});

export const account = privateKeyToAccount(config.agentPrivateKey);

export const publicClient = createPublicClient({
  chain:     celo,
  transport: http(config.rpcUrl),
});

export const walletClient = createWalletClient({
  account,
  chain:     celo,
  transport: http(config.rpcUrl),
});
