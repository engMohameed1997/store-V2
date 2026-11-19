import { unstable_cache } from "next/cache";
import { db } from "@/lib/db";

/** What the chat widget renders as a product card (image, price, link). */
export interface ChatProductCard {
  slug: string;
  name: string;
  price: number;
  compareAtPrice: number | null;
  inStock: boolean;
  image: string | null;
  brand: string | null;
  category: string | null;
}

interface CatalogItem extends ChatProductCard {
  id: string;
  /** Normalized search text per field. */
  title: string;
  brandText: string;
  categoryText: string;
  sku: string;
}

/**
 * The assistant searches an in-memory copy of the active catalog: a few
 * hundred rows, refreshed every 5 minutes. That allows Arabic-aware word
 * matching and ranking that a single SQL "contains" can't do.
 */
const loadCatalog = unstable_cache(
  async (): Promise<CatalogItem[]> => {
    const rows = await db.product.findMany({
      where: { deletedAt: null, isActive: true },
      select: {
        id: true, name: true, nameAr: true, slug: true, sku: true,
        price: true, compareAtPrice: true, stock: true,
        brand: { select: { name: true, nameAr: true } },
        category: { select: { name: true, nameAr: true } },
        images: {
          select: { url: true },
          orderBy: [{ isPrimary: "desc" }, { position: "asc" }],
          take: 1,
        },
      },
    });
    return rows.map((p) => ({
      id: p.id,
      slug: p.slug,
      name: p.nameAr || p.name,
      price: Number(p.price),
      compareAtPrice: p.compareAtPrice != null ? Number(p.compareAtPrice) : null,
      inStock: p.stock > 0,
      image: p.images[0]?.url ?? null,
      brand: p.brand?.name ?? null,
      category: p.category?.nameAr || p.category?.name || null,
      title: normalize(`${p.name} ${p.nameAr ?? ""}`),
      brandText: normalize(`${p.brand?.name ?? ""} ${p.brand?.nameAr ?? ""}`),
      categoryText: normalize(`${p.category?.name ?? ""} ${p.category?.nameAr ?? ""}`),
      sku: normalize(p.sku ?? ""),
    }));
  },
  ["chatbot-catalog"],
  { revalidate: 300 }
);

/** Folds Arabic spelling variants (أ/إ/آ, ة/ه, ى/ي, diacritics, digits) and case. */
function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670\u0640]/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

const STOP_WORDS = new Set(["ال", "و", "في", "من", "عن", "على", "مع", "او", "the", "and", "for"]);

/** Query words, each with variants: "الثلاجة" also matches "ثلاجات". */
function queryTerms(query: string): string[][] {
  return normalize(query)
    .split(" ")
    .filter((w) => w && !STOP_WORDS.has(w) && (w.length >= 2 || /\d/.test(w)))
    .map((w) => {
      const v = new Set([w]);
      let t = w;
      if (t.length > 4 && t.startsWith("ال")) v.add((t = t.slice(2)));
      if (t.length > 4 && t.endsWith("ات")) v.add(t.slice(0, -2));
      else if (t.length > 3 && t.endsWith("ه")) v.add(t.slice(0, -1));
      return [...v];
    });
}

/** Short terms ("lg", "22") must start a word; longer ones may appear anywhere. */
function fieldHas(field: string, variants: string[]): boolean {
  return variants.some((v) =>
    v.length <= 2 ? ` ${field}`.includes(` ${v}`) : field.includes(v)
  );
}

const FIELD_WEIGHTS = [
  ["title", 3],
  ["brandText", 3],
  ["categoryText", 2],
  ["sku", 1],
] as const;

function scoreItem(item: CatalogItem, terms: string[][]) {
  let matched = 0;
  let score = 0;
  for (const variants of terms) {
    const best = Math.max(
      0,
      ...FIELD_WEIGHTS.map(([f, w]) => (fieldHas(item[f], variants) ? w : 0))
    );
    if (best > 0) {
      matched++;
      score += best;
    }
  }
  return { matched, score };
}

function brandMatches(item: CatalogItem, brand: string): boolean {
  if (!item.brandText) return false;
  const text = ` ${item.brandText} `;
  if (text.includes(` ${brand} `)) return true;
  // Transliteration drift, e.g. "سامسونج" vs "سامسونك".
  return brand.length >= 5 && text.includes(` ${brand.slice(0, -1)}`);
}

export type SearchSort = "relevance" | "price_asc" | "price_desc";

/**
 * Products matching all query words; if none do, the ones matching the most
 * words (exact = false). An empty query lists everything in the pool.
 */
function rank(pool: CatalogItem[], terms: string[][], sort: SearchSort) {
  const scored = pool.map((item) => ({ item, ...scoreItem(item, terms) }));
  const best = Math.max(0, ...scored.map((s) => s.matched));
  if (terms.length > 0 && best === 0) return { items: [], exact: false };

  const hits = scored.filter((s) => s.matched === best);
  hits.sort((a, b) => {
    if (a.item.inStock !== b.item.inStock) return a.item.inStock ? -1 : 1;
    if (sort === "price_asc") return a.item.price - b.item.price;
    if (sort === "price_desc") return b.item.price - a.item.price;
    return b.score - a.score || a.item.price - b.item.price;
  });
  return { items: hits.map((h) => h.item), exact: best === terms.length };
}

function toCard(item: CatalogItem): ChatProductCard {
  return {
    slug: item.slug,
    name: item.name,
    price: item.price,
    compareAtPrice: item.compareAtPrice,
    inStock: item.inStock,
    image: item.image,
    brand: item.brand,
    category: item.category,
  };
}

const RESULT_LIMIT = 6;

export interface SearchInput {
  query: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: SearchSort;
}

export type SearchResult =
  | { found: true; exact: boolean; total: number; products: ChatProductCard[] }
  | {
      found: false;
      reason: "no_match" | "brand_not_available" | "brand_has_no_match";
      message: string;
      /** The same search without the brand — offered as alternatives. */
      products: ChatProductCard[];
      /** Brands that do have matching products. */
      availableBrands?: string[];
    };

export async function searchCatalog(input: SearchInput): Promise<SearchResult> {
  const sort = input.sort ?? "relevance";
  const terms = queryTerms(input.query);
  const pool = (await loadCatalog()).filter(
    (p) =>
      (input.minPrice === undefined || p.price >= input.minPrice) &&
      (input.maxPrice === undefined || p.price <= input.maxPrice)
  );

  const brand = input.brand ? normalize(input.brand) : "";
  if (!brand) {
    const { items, exact } = rank(pool, terms, sort);
    if (!items.length) {
      return { found: false, reason: "no_match", message: "لم أجد منتجات تطابق بحثك.", products: [] };
    }
    return { found: true, exact, total: items.length, products: items.slice(0, RESULT_LIMIT).map(toCard) };
  }

  const brandPool = pool.filter((p) => brandMatches(p, brand));
  const branded = brandPool.length ? rank(brandPool, terms, sort) : { items: [], exact: false };
  if (branded.items.length) {
    return {
      found: true,
      exact: branded.exact,
      total: branded.items.length,
      products: branded.items.slice(0, RESULT_LIMIT).map(toCard),
    };
  }

  // The brand isn't stocked, or has nothing of this kind: offer other brands.
  const alternatives = terms.length ? rank(pool, terms, sort).items : [];
  return {
    found: false,
    reason: brandPool.length ? "brand_has_no_match" : "brand_not_available",
    message: brandPool.length
      ? `ماركة ${input.brand} متوفرة في المتجر لكن لا يوجد منها «${input.query}».`
      : `ماركة ${input.brand} غير متوفرة في المتجر حالياً.`,
    products: alternatives.slice(0, RESULT_LIMIT).map(toCard),
    availableBrands: [...new Set(alternatives.map((p) => p.brand).filter((b): b is string => !!b))].slice(0, 10),
  };
}

const stripHtml = (s: string) => s.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

/** Card plus the details the assistant may quote (active products only). */
export async function getProductDetail(idOrSlug: string) {
  const item = (await loadCatalog()).find((p) => p.slug === idOrSlug || p.id === idOrSlug);
  if (!item) return null;

  const extra = await db.product.findUnique({
    where: { id: item.id },
    select: {
      description: true,
      descriptionAr: true,
      avgRating: true,
      reviewCount: true,
      specs: { select: { key: true, value: true }, orderBy: { position: "asc" }, take: 20 },
    },
  });
  const description = stripHtml(extra?.descriptionAr || extra?.description || "");

  return {
    product: toCard(item),
    details: {
      description: description.slice(0, 600),
      specs: extra?.specs ?? [],
      avgRating: extra ? Number(extra.avgRating) : 0,
      reviewCount: extra?.reviewCount ?? 0,
    },
  };
}
