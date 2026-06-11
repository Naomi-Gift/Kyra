import "dotenv/config";

function required(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required env var: ${key}`);
  return val;
}

export const config = {
  rpcUrl:           required("CELO_RPC_URL"),
  agentPrivateKey:  required("AGENT_PRIVATE_KEY") as `0x${string}`,
  contractAddress:  required("KYRA_VAULT_ADDRESS") as `0x${string}`,
  cUSDAddress:      required("CUSD_ADDRESS") as `0x${string}`,
  cronSchedule:     process.env.CRON_SCHEDULE ?? "0 8 * * *",   // 08:00 UTC daily
  publicUrl:        process.env.PUBLIC_URL    ?? "https://kyra.xyz",
  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN ?? "",
    chatId:   process.env.TELEGRAM_CHAT_ID   ?? "",
  },
  email: {
    resendKey: process.env.RESEND_API_KEY ?? "",
    from:      process.env.FROM_EMAIL     ?? "noreply@kyra.xyz",
  },
} as const;
