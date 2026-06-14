import { db } from "@/lib/db";

/**
 * TelegramService — sends notifications to a Telegram chat/group
 * via the Bot API. Reads bot token & chat ID from StoreSettings.
 */
export class TelegramService {
  private static async getConfig(): Promise<{ botToken: string; chatId: string } | null> {
    const [tokenSetting, chatSetting] = await Promise.all([
      db.storeSetting.findUnique({ where: { key: "telegramBotToken" } }),
      db.storeSetting.findUnique({ where: { key: "telegramChatId" } }),
    ]);

    const botToken = tokenSetting?.value as string | undefined;
    const chatId = chatSetting?.value as string | undefined;

    if (!botToken || !chatId) return null;
    return { botToken, chatId };
  }

  /**
   * Send a plain-text message to the configured Telegram chat.
   */
  static async sendMessage(text: string): Promise<boolean> {
    try {
      const config = await this.getConfig();
      if (!config) return false;

      const url = `https://api.telegram.org/bot${config.botToken}/sendMessage`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: config.chatId,
          text,
          parse_mode: "HTML",
        }),
      });

      return res.ok;
    } catch (error) {
      console.error("[TelegramService] Failed to send message:", error);
      return false;
    }
  }

  // ─── Pre-built notification templates ────────────────────────

  static async notifyNewOrder(order: {
    orderNumber: string;
    totalAmount: number | string;
    customerName: string;
    customerPhone?: string | null;
    itemCount: number;
  }): Promise<boolean> {
    const text = [
      `🛒 <b>طلب جديد #${order.orderNumber}</b>`,
      ``,
      `👤 الزبون: ${order.customerName}`,
      order.customerPhone ? `📱 الهاتف: <code>${order.customerPhone}</code>` : null,
      `📦 عدد المنتجات: ${order.itemCount}`,
      `💰 المبلغ: ${Number(order.totalAmount).toLocaleString("ar-IQ")} د.ع`,
    ]
      .filter(Boolean)
      .join("\n");

    return this.sendMessage(text);
  }

  static async notifyNewTicket(ticket: {
    ticketNumber: string;
    subject: string;
    customerName: string;
    priority: string;
  }): Promise<boolean> {
    const priorityEmoji: Record<string, string> = {
      LOW: "🟢",
      MEDIUM: "🟡",
      HIGH: "🟠",
      URGENT: "🔴",
    };

    const text = [
      `🎫 <b>تذكرة دعم جديدة #${ticket.ticketNumber}</b>`,
      ``,
      `📋 الموضوع: ${ticket.subject}`,
      `👤 الزبون: ${ticket.customerName}`,
      `${priorityEmoji[ticket.priority] || "🟡"} الأولوية: ${ticket.priority}`,
    ].join("\n");

    return this.sendMessage(text);
  }

  static async notifyNewMessage(data: {
    ticketNumber: string;
    customerName: string;
    messagePreview: string;
  }): Promise<boolean> {
    const text = [
      `💬 <b>رسالة جديدة في التذكرة #${data.ticketNumber}</b>`,
      ``,
      `👤 ${data.customerName}`,
      `📝 ${data.messagePreview.slice(0, 200)}`,
    ].join("\n");

    return this.sendMessage(text);
  }
}
