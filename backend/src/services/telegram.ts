import { logger } from "../config/logger";

export interface TelegramOrderNotification {
  orderId: number;
  source: "POS" | "Online Checkout";
  customerName?: string | null;
  cashierName?: string | null;
  paymentMethod?: string | null;
  paymentStatus: string;
  subtotal: number;
  discount: number;
  deliveryFee?: number;
  total: number;
  shippingAddress?: string | null;
  itemCount?: number | null;
  createdAt?: string | Date | null;
}

interface TelegramSendMessageResponse {
  ok: boolean;
  description?: string;
}

function getTelegramConfig() {
  const botToken = process.env.TELEGRAM_BOT_TOKEN?.trim();
  const chatId = process.env.TELEGRAM_CHAT_ID?.trim();
  const notificationsEnabled =
    process.env.TELEGRAM_NOTIFICATIONS_ENABLED?.trim() === "true";

  const isEnabled = Boolean(botToken && chatId && notificationsEnabled);

  return { botToken, chatId, isEnabled };
}

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function formatMoney(value: number): string {
  return `$${Number(value || 0).toFixed(2)}`;
}

function normalizePaymentMethod(method?: string | null): string {
  const labels: Record<string, string> = {
    cash: "Cash",
    khqr: "KHQR Bakong",
    aba: "ABA Bank",
    acleda: "ACLEDA",
    canadia: "Vatanak",
    wing: "Wing Money",
  };
  return labels[method ?? ""] ?? method ?? "Unknown";
}

async function sendTelegramMessageToChatId(chatId: string | number, text: string): Promise<boolean> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN?.trim();

  if (!botToken) {
    logger.info("Telegram bot reply skipped: TELEGRAM_BOT_TOKEN is missing.");
    return false;
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    });

    const payload = (await response.json().catch(() => ({}))) as Partial<TelegramSendMessageResponse>;

    if (!response.ok || payload.ok === false) {
      logger.error({ status: response.status, payload }, "Failed to send Telegram bot reply");
      return false;
    }

    return true;
  } catch (error) {
    logger.error({ error }, "Telegram bot reply error");
    return false;
  }
}

export function isTelegramEnabled() {
  return getTelegramConfig().isEnabled;
}

export async function sendTelegramMessage(text: string): Promise<boolean> {
  const { botToken, chatId, isEnabled } = getTelegramConfig();

  if (!isEnabled) {
    logger.info("Telegram notification skipped: TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID is missing.");
    return false;
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    });

    const payload = (await response.json().catch(() => ({}))) as Partial<TelegramSendMessageResponse>;

    if (!response.ok || payload.ok === false) {
  console.error("Telegram send failed:", {
    status: response.status,
    payload,
  });

  logger.error(
    { status: response.status, payload },
    "Failed to send Telegram message"
  );

  return false;
}

    return true;
  } catch (error) {
    logger.error({ error }, "Telegram message error");
    return false;
  }
}

export { sendTelegramMessageToChatId };

export async function notifyTelegramOrderPayment(order: TelegramOrderNotification): Promise<boolean> {
  const isPaid = order.paymentStatus === "paid";
  const icon = isPaid ? "✅" : "⏳";
  const createdAt = order.createdAt ? new Date(order.createdAt).toLocaleString("en-US", { timeZone: "Asia/Phnom_Penh" }) : "Now";

  const lines = [
    `${icon} <b>SabayTenh Payment ${isPaid ? "Simulated" : "Pending"}</b>`,
    "",
    `<b>Order:</b> #${order.orderId}`,
    `<b>Source:</b> ${escapeHtml(order.source)}`,
    `<b>Customer:</b> ${escapeHtml(order.customerName || "Walk-in / Online Customer")}`,
    order.cashierName ? `<b>Cashier:</b> ${escapeHtml(order.cashierName)}` : null,
    `<b>Payment:</b> ${escapeHtml(normalizePaymentMethod(order.paymentMethod))}`,
    `<b>Status:</b> ${escapeHtml(order.paymentStatus.toUpperCase())}`,
    `<b>Items:</b> ${order.itemCount ?? 0}`,
    `<b>Subtotal:</b> ${formatMoney(order.subtotal)}`,
    `<b>Discount:</b> ${formatMoney(order.discount)}`,
    order.deliveryFee && order.deliveryFee > 0 
      ? `<b>Delivery:</b> ${formatMoney(order.deliveryFee)}` 
      : `<b>Delivery:</b> Free`,
    `<b>Total:</b> ${formatMoney(order.total)}`,
    order.shippingAddress ? `<b>Address:</b> ${escapeHtml(order.shippingAddress)}` : null,
    `<b>Time:</b> ${escapeHtml(createdAt)}`,
  ].filter(Boolean);

  return sendTelegramMessage(lines.join("\n"));
}

export function buildTelegramHelpMessage() {
  return [
    "🤖 <b>SabayTenh Mart Bot</b>",
    "",
    "I can notify your Telegram when customers or POS admins simulate a payment.",
    "",
    "Commands:",
    "/start - Show bot introduction",
    "/help - Show commands",
    "/status - Check bot connection",
    "/chatid - Show this Telegram chat ID",
  ].join("\n");
}