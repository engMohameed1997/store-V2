import { CHAT_LIMITS } from "./config";

export interface IncomingMessage {
  role: string;
  content: string;
}

export class ChatGuardError extends Error {
  constructor(
    message: string,
    public readonly status: number = 400
  ) {
    super(message);
    this.name = "ChatGuardError";
  }
}

export function validateMessages(raw: unknown): IncomingMessage[] {
  if (!Array.isArray(raw)) {
    throw new ChatGuardError("messages must be an array");
  }

  if (raw.length > CHAT_LIMITS.MAX_MESSAGES_PER_SESSION) {
    throw new ChatGuardError(
      `تجاوزت الحد الأقصى للمحادثة (${CHAT_LIMITS.MAX_MESSAGES_PER_SESSION} رسالة). ابدأ محادثة جديدة.`,
      429
    );
  }

  return raw.map((m, i) => {
    if (typeof m !== "object" || m === null) {
      throw new ChatGuardError(`رسالة غير صالحة في الموضع ${i}`);
    }

    const msg = m as Record<string, unknown>;

    if (msg.role !== "user" && msg.role !== "assistant") {
      throw new ChatGuardError(`role غير مسموح به: ${msg.role}`);
    }

    if (typeof msg.content !== "string") {
      throw new ChatGuardError(`محتوى الرسالة يجب أن يكون نصاً`);
    }

    if (msg.role === "user" && msg.content.length > CHAT_LIMITS.MAX_USER_MESSAGE_LENGTH) {
      throw new ChatGuardError(
        `الرسالة طويلة جداً (الحد الأقصى ${CHAT_LIMITS.MAX_USER_MESSAGE_LENGTH} حرف)`,
        400
      );
    }

    return { role: msg.role as string, content: msg.content as string };
  });
}

export function validateCurrentPage(raw: unknown): string {
  if (typeof raw !== "string") return "home";
  const allowed = [
    "home", "products", "product", "cart", "checkout",
    "account", "orders", "wishlist", "search", "faq",
    "delivery", "returns", "privacy", "about", "payment",
  ];
  const page = raw.replace(/[^a-z0-9-]/g, "").slice(0, 50);
  return allowed.includes(page) ? page : "home";
}

export function trimMessagesToFit(
  messages: IncomingMessage[],
  maxTokensEstimate: number
): IncomingMessage[] {
  const estimateTokens = (text: string) => Math.ceil(text.length / 4);

  let total = 0;
  const result: IncomingMessage[] = [];

  for (let i = messages.length - 1; i >= 0; i--) {
    const tokens = estimateTokens(messages[i].content);
    if (total + tokens > maxTokensEstimate) break;
    result.unshift(messages[i]);
    total += tokens;
  }

  return result;
}
