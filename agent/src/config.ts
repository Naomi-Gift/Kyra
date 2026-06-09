import "dotenv/config";

function required(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required env var: ${key}`);
  return val;
}

export const config = {
  rpcUrl:           required("CELO_RPC_URL"),
  agentPrivateKey:  required("AGENT_PRIVATE_KEY") as `0x${string}`,
  contractAddress:  required("CHORE_AGENT_ADDRESS") as `0x${string}`,
  cUSDAddress:      required("CUSD_ADDRESS") as `0x${string}`,
  cronSchedule:     process.env.CRON_SCHEDULE ?? "0 * * * *",
  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN ?? "",
    chatId:   process.env.TELEGRAM_CHAT_ID   ?? "",
  },
} as const;
