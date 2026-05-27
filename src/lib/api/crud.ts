import { db } from "@/lib/db";
import { Errors } from "./errors";
import { parsePagination, parseSorting } from "./pagination";
import { apiSuccess, apiPaginated, apiCreated, apiNoContent } from "./response";
import { sanitizeObject } from "./sanitize";
import { NextRequest, NextResponse } from "next/server";

const ALLOWED_MODELS = new Set([
  "product", "category", "brand", "coupon", "order", "user",
  "review", "banner", "page", "shippingZone", "storeSetting",
]);

type ModelName = string;

interface CrudListOptions {
  model: ModelName;
  searchFields?: string[];
  allowedSortFields?: string[];
  defaultSortField?: string;
  include?: Record<string, unknown>;
  where?: Record<string, unknown>;
  select?: Record<string, boolean>;
}

interface CrudGetOptions {
  model: ModelName;
  include?: Record<string, unknown>;
  select?: Record<string, boolean>;
}

interface CrudCreateOptions {
  model: ModelName;
  include?: Record<string, unknown>;
}

interface CrudUpdateOptions {
  model: ModelName;
  include?: Record<string, unknown>;
}

interface CrudDeleteOptions {
  model: ModelName;
  soft?: boolean;
}

function getModel(name: ModelName) {
  if (!ALLOWED_MODELS.has(name)) {
    throw Errors.badRequest(`Invalid model: ${name}`);
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (db as any)[name];
}

export async function crudList(
  request: NextRequest,
  options: CrudListOptions
): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const { page, limit, skip } = parsePagination(searchParams);
  const { field: sortField, order: sortOrder } = parseSorting(
    searchParams,
    options.allowedSortFields || ["createdAt"],
    options.defaultSortField
  );

  const search = searchParams.get("search")?.trim();
  const model = getModel(options.model);

  const where: Record<string, unknown> = { ...options.where };

  if (search && options.searchFields?.length) {
    where.OR = options.searchFields.map((field) => ({
      [field]: { contains: search, mode: "insensitive" },
    }));
  }

  const [data, total] = await Promise.all([
    model.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortField]: sortOrder },
      ...(options.include && { include: options.include }),
      ...(options.select && { select: options.select }),
    }),
    model.count({ where }),
  ]);

  return apiPaginated(data, total, page, limit);
}

export async function crudGet(
  id: string,
  options: CrudGetOptions
): Promise<NextResponse> {
  const model = getModel(options.model);

  const data = await model.findFirst({
    where: { id, deletedAt: null },
    ...(options.include && { include: options.include }),
    ...(options.select && { select: options.select }),
  });

  if (!data) throw Errors.notFound(options.model);

  return apiSuccess(data);
}

export async function crudCreate(
  rawData: Record<string, unknown>,
  options: CrudCreateOptions
): Promise<NextResponse> {
  const sanitized = sanitizeObject(rawData);
  const model = getModel(options.model);

  const data = await model.create({
    data: sanitized,
    ...(options.include && { include: options.include }),
  });

  return apiCreated(data);
}

export async function crudUpdate(
  id: string,
  rawData: Record<string, unknown>,
  options: CrudUpdateOptions
): Promise<NextResponse> {
  const sanitized = sanitizeObject(rawData);
  const model = getModel(options.model);

  const existing = await model.findFirst({ where: { id, deletedAt: null } });
  if (!existing) throw Errors.notFound(options.model);

  const data = await model.update({
    where: { id },
    data: sanitized,
    ...(options.include && { include: options.include }),
  });

  return apiSuccess(data);
}

export async function crudDelete(
  id: string,
  options: CrudDeleteOptions
): Promise<NextResponse> {
  const model = getModel(options.model);

  const existing = await model.findFirst({ where: { id, deletedAt: null } });
  if (!existing) throw Errors.notFound(options.model);

  // Default to soft delete for safety, hard delete only if explicitly requested
  if (options.soft === false) {
    await model.delete({ where: { id } });
  } else {
    await model.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  return apiNoContent();
}
