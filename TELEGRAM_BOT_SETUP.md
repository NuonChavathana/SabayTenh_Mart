# SabayTenh Telegram Bot Setup

This feature adds Telegram notifications when a customer checkout or admin POS sale creates a simulated payment.

## What changed

- No website redesign.
- No real payment gateway.
- Existing customer QR payment simulation still works.
- POS/checkout orders using KHQR, ABA, ACLEDA, Vatanak, or Wing are saved as `paymentStatus: "paid"` to simulate successful payment.
- Cash orders stay `paymentStatus: "pending"`.
- Telegram receives an order/payment message with order ID, source, customer/cashier, method, total, and address.

## Files added

- `backend/src/services/telegram.ts`
- `backend/src/routes/telegram.ts`
- `TELEGRAM_BOT_SETUP.md`

## Files updated

- `backend/src/routes/index.ts`
- `backend/src/routes/orders.ts`
- `.env.example`

## Setup steps

### 1. Create Telegram bot

1. Open Telegram.
2. Search `@BotFather`.
3. Send `/newbot`.
4. Copy the bot token.

### 2. Get your chat ID

Simple way:

1. Send a message to your bot, for example `/start`.
2. Open this URL in your browser:

```txt
https://api.telegram.org/botYOUR_BOT_TOKEN/getUpdates
```

3. Find `chat.id` in the JSON result.

For a group chat, add the bot to the group first, send a message in the group, then open the same URL.

### 3. Add variables to `.env`

```env
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_CHAT_ID=your_chat_id_here
```

### 4. Restart backend

```bash
pnpm run dev:backend
```

### 5. Test Telegram connection

```bash
curl -X POST http://localhost:8080/api/telegram/test
```

You should receive a Telegram test message.

## Bot API routes

| Method | URL | Purpose |
|---|---|---|
| GET | `/api/telegram/status` | Check if bot env variables are configured |
| POST | `/api/telegram/test` | Send test Telegram message |
| POST | `/api/telegram/webhook` | Optional Telegram webhook endpoint |

## Optional webhook setup

If your backend is online with HTTPS, set Telegram webhook like this:

```txt
https://api.telegram.org/botYOUR_BOT_TOKEN/setWebhook?url=https://YOUR_DOMAIN.com/api/telegram/webhook
```

Supported commands:

- `/start`
- `/help`
- `/status`
- `/chatid`

## Important note

This is only a simulated payment system. It does not verify real bank transfer, KHQR transfer, ABA, ACLEDA, Wing, or Vatanak payment.