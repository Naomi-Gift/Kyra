import { config } from "./config.js";
import { logger } from "./logger.js";

/**
 * Send a Telegram message if credentials are configured.
 * Falls back to a log-only no-op if not set up.
 */
export async function notify(message: string): Promise<void> {
  const { botToken, chatId } = config.telegram;

  if (!botToken || !chatId) {
    logger.info({ message }, "Notification (Telegram not configured)");
    return;
  }

  try {
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const res = await fetch(url, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ chat_id: chatId, text: message, parse_mode: "Markdown" }),
    });

    if (!res.ok) {
      const body = await res.text();
      logger.warn({ status: res.status, body }, "Telegram notification failed");
    }
  } catch (err) {
    logger.warn({ err }, "Failed to send Telegram notification");
  }
}
