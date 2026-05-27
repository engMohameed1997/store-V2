export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}

const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 20;

export function parsePagination(
  searchParams: URLSearchParams
): PaginationParams {
  const rawPage = parseInt(searchParams.get("page") || "1", 10);
  const rawLimit = parseInt(
    searchParams.get("limit") || String(DEFAULT_LIMIT),
    10
  );

  const page = Math.max(1, isNaN(rawPage) ? 1 : rawPage);
  const limit = Math.min(
    MAX_LIMIT,
    Math.max(1, isNaN(rawLimit) ? DEFAULT_LIMIT : rawLimit)
  );
  const skip = (page - 1) * limit;

  return { page, limit, skip };
}

export function parseSorting(
  searchParams: URLSearchParams,
  allowedFields: string[],
  defaultField = "createdAt",
  defaultOrder: "asc" | "desc" = "desc"
): { field: string; order: "asc" | "desc" } {
  const rawField = searchParams.get("sortBy") || defaultField;
  const rawOrder = searchParams.get("sortOrder") || defaultOrder;

  const field = allowedFields.includes(rawField) ? rawField : defaultField;
  const order = rawOrder === "asc" ? "asc" : "desc";

  return { field, order };
}
