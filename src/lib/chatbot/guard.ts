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

  const messages = raw.map((m, i) => {
    if (typeof m !== "object" || m === null) {
      throw new ChatGuardError(`رسالة غير صالحة في الموضع ${i}`);
    }

    const msg = m as Record<string, unknown>;

    if (msg.role !== "user" && msg.role !== "assistant") {
      throw new ChatGuardError(`role غير مسموح به: ${msg.role}`);
    }

    // Extract text content: support both legacy "content" string and UIMessage "parts" array
    let content = "";
    if (typeof msg.content === "string") {
      content = msg.content;
    } else if (Array.isArray(msg.parts)) {
      content = (msg.parts as Array<Record<string, unknown>>)
        .filter((p) => p.type === "text" && typeof p.text === "string")
        .map((p) => p.text as string)
        .join("");
    }

    if (!content) {
      throw new ChatGuardError(`محتوى الرسالة يجب أن يكون نصاً`);
    }

    if (msg.role === "user" && content.length > CHAT_LIMITS.MAX_USER_MESSAGE_LENGTH) {
      throw new ChatGuardError(
        `الرسالة طويلة جداً (الحد الأقصى ${CHAT_LIMITS.MAX_USER_MESSAGE_LENGTH} حرف)`,
        400
      );
    }

    if (msg.role === "assistant" && content.length > CHAT_LIMITS.MAX_ASSISTANT_MESSAGE_LENGTH) {
      throw new ChatGuardError("محتوى المحادثة غير صالح. ابدأ محادثة جديدة.", 400);
    }

    return { role: msg.role as string, content };
  });

  // The conversation must end with the user's new message.
  if (messages.length === 0 || messages[messages.length - 1].role !== "user") {
    throw new ChatGuardError("آخر رسالة يجب أن تكون من المستخدم.", 400);
  }

  return messages;
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
  maxChars: number
): IncomingMessage[] {
  let total = 0;
  const result: IncomingMessage[] = [];

  for (let i = messages.length - 1; i >= 0; i--) {
    const size = messages[i].content.length;
    if (total + size > maxChars) break;
    result.unshift(messages[i]);
    total += size;
  }

  // History must start with a user turn so a forged assistant turn can't lead.
  while (result.length > 0 && result[0].role !== "user") result.shift();

  return result;
}
