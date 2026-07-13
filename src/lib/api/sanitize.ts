const HTML_ENTITIES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#x27;",
  "/": "&#x2F;",
  "`": "&#96;",
};

const DANGEROUS_PATTERNS = [
  /(<script[\s>])/gi,
  /(<\/script>)/gi,
  /(javascript\s*:)/gi,
  /(on\w+\s*=)/gi,
  /(data\s*:\s*text\/html)/gi,
  /(eval\s*\()/gi,
  /(expression\s*\()/gi,
  /(url\s*\()/gi,
  /(import\s*\()/gi,
  /(\bvbscript\s*:)/gi,
];

// Note: SQL injection protection is handled by Prisma ORM's parameterized queries.
// These patterns only detect obvious attack payloads in raw user input (logging/alerting).
const SQL_INJECTION_PATTERNS = [
  /(--\s)/g,
  /(;\s*(drop|alter|truncate|exec)\b)/gi,
  /(\b(or|and)\b\s+\d+\s*=\s*\d+)/gi,
  /('\s*(or|and)\s+')/gi,
];

export function escapeHtml(str: string): string {
  return str.replace(/[&<>"'`/]/g, (char) => HTML_ENTITIES[char] || char);
}

export function sanitizeString(input: string): string {
  let cleaned = input.trim();

  cleaned = cleaned.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");

  cleaned = cleaned.replace(/<script[\s\S]*?<\/script>/gi, "");

  cleaned = cleaned.replace(/<style[\s\S]*?<\/style>/gi, "");

  for (const pattern of DANGEROUS_PATTERNS) {
    cleaned = cleaned.replace(pattern, "");
  }

  cleaned = escapeHtml(cleaned);

  return cleaned;
}

export function sanitizeObject<T>(obj: T): T {
  if (typeof obj === "string") {
    return sanitizeString(obj) as T;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeObject(item)) as T;
  }

  if (obj !== null && typeof obj === "object") {
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      sanitized[sanitizeString(key)] = sanitizeObject(value);
    }
    return sanitized as T;
  }

  return obj;
}

export function detectSqlInjection(input: string): boolean {
  return SQL_INJECTION_PATTERNS.some((pattern) => pattern.test(input));
}

export function sanitizeSearchQuery(query: string): string {
  return query
    .replace(/[^\w\s\u0600-\u06FF\u0750-\u077F-]/g, "")
    .trim()
    .slice(0, 200);
}

export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/\.{2,}/g, ".")
    .slice(0, 255);
}
