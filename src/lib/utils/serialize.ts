/**
 * Recursively converts Prisma Decimal objects and Dates to plain serializable values
 * so that data can safely be passed from Server Components to Client Components.
 */

function isDecimal(value: unknown): value is { toNumber(): number } {
  return (
    value !== null &&
    typeof value === "object" &&
    "toNumber" in value &&
    typeof (value as Record<string, unknown>).toNumber === "function" &&
    "toFixed" in value
  );
}

export function serialize<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj;

  if (isDecimal(obj)) {
    return obj.toNumber() as unknown as T;
  }

  if (obj instanceof Date) {
    return obj.toISOString() as unknown as T;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => serialize(item)) as unknown as T;
  }

  if (typeof obj === "object") {
    const plain: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      plain[key] = serialize(value);
    }
    return plain as T;
  }

  return obj;
}
