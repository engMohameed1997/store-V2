import { NextRequest } from "next/server";
import { ZodSchema, ZodError } from "zod";
import { Errors } from "./errors";

export async function validateBody<T>(
  request: NextRequest,
  schema: ZodSchema<T>
): Promise<T> {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    throw Errors.badRequest("Invalid JSON body");
  }

  const result = schema.safeParse(body);
  if (!result.success) {
    throw new ZodError(result.error.issues);
  }

  return result.data;
}

export function validateQuery<T>(
  searchParams: URLSearchParams,
  schema: ZodSchema<T>
): T {
  const params: Record<string, string> = {};
  searchParams.forEach((value, key) => {
    params[key] = value;
  });

  const result = schema.safeParse(params);
  if (!result.success) {
    throw new ZodError(result.error.issues);
  }

  return result.data;
}

export function validateParams<T>(
  params: Record<string, string>,
  schema: ZodSchema<T>
): T {
  const result = schema.safeParse(params);
  if (!result.success) {
    throw new ZodError(result.error.issues);
  }

  return result.data;
}
