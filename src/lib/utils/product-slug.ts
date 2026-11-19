import crypto from "crypto";

const MAX_BASE_LENGTH = 60;
const SUFFIX_RE = /-([0-9a-f]{6})$/;

/** "قلاية نوال FRY-5145" → ["fry", "5145"]: Latin words and numbers only. */
function latinWords(s: string | null | undefined): string[] {
  if (!s) return [];
  return (
    s
      .toLowerCase()
      .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
      .match(/[a-z0-9]+/g) ?? []
  );
}

export function newSlugSuffix(): string {
  return crypto.randomBytes(3).toString("hex");
}

/** The 6-hex suffix that identifies a product across slug changes. */
export function slugSuffix(slug: string): string | null {
  return SUFFIX_RE.exec(slug)?.[1] ?? null;
}

/**
 * ASCII product slug from the brand and the model code in the name, e.g.
 * NEWAL + "قلاية نوال FRY-5145" → "newal-fry-5145-ab7350". Arabic slugs
 * become long percent-encoded links when shared. Without a model code the
 * category's English name is used instead.
 *
 * Pass the product's current suffix when renaming, so old links still
 * resolve (see ProductService.findSlugBySuffix).
 */
export function buildProductSlug(
  parts: { name: string; brand?: string | null; category?: string | null },
  suffix: string = newSlugSuffix()
): string {
  const words: string[] = [];
  const add = (list: string[]) => {
    for (const w of list) if (!words.includes(w)) words.push(w);
  };

  add(latinWords(parts.brand));
  const model = latinWords(parts.name);
  add(model);
  if (model.length === 0) add(latinWords(parts.category));

  let base = "";
  for (const w of words) {
    const next = base ? `${base}-${w}` : w;
    if (next.length > MAX_BASE_LENGTH) break;
    base = next;
  }
  return `${base || "product"}-${suffix}`;
}
