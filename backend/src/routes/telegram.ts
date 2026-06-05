import { Router, type IRouter } from "express";
import {
  buildTelegramHelpMessage,
  isTelegramEnabled,
  sendTelegramMessage,
  sendTelegramMessageToChatId,
} from "../services/telegram";

const router: IRouter = Router();

router.get("/status", (_req, res): void => {
  res.json({
    enabled: isTelegramEnabled(),
    message: isTelegramEnabled()
      ? "Telegram bot is configured."
      : "Telegram bot is not configured. Add TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID to .env.",
  });
});

router.get("/test", async (_req, res): Promise<void> => {
  const sent = await sendTelegramMessage(
    "🧪 <b>SabayTenh Telegram test</b>\nYour Telegram bot connection works."
  );

  res.status(sent ? 200 : 503).json({ sent });
});

router.post("/webhook", async (req, res): Promise<void> => {
  const message = req.body?.message;
  const text = String(message?.text ?? "").trim().toLowerCase();
  const chatId = message?.chat?.id;

  if (!message || !chatId) {
    res.sendStatus(200);
    return;
  }

  if (["/start", "/help"].includes(text)) {
    await sendTelegramMessageToChatId(chatId, buildTelegramHelpMessage());
  } else if (text === "/status") {
    await sendTelegramMessageToChatId(
      chatId,
      isTelegramEnabled()
        ? "✅ <b>SabayTenh Bot Status</b>\nBot notifications are configured."
        : "⚠️ <b>SabayTenh Bot Status</b>\nPlease set TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID in .env."
    );
  } else if (text === "/chatid") {
    await sendTelegramMessageToChatId(
      chatId,
      `💬 <b>Chat ID</b>\n<code>${chatId}</code>`
    );
  } else if (text.startsWith("/")) {
    await sendTelegramMessageToChatId(
      chatId,
      "I do not know that command yet. Send /help to see commands."
    );
  }

  res.sendStatus(200);
});

export default router;