import { NextResponse } from "next/server";
import { AppError } from "./errors";
import { apiError } from "./response";
import { ZodError } from "zod";

export function handleApiError(error: unknown): NextResponse {
  if (error instanceof AppError) {
    return apiError(error.code, error.message, error.statusCode, error.details);
  }

  if (error instanceof ZodError) {
    const formatted = error.issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
    }));
    return apiError("VALIDATION_ERROR", "Invalid input", 422, formatted);
  }

  if (
    error instanceof Error &&
    error.message.includes("Unique constraint failed")
  ) {
    return apiError("CONFLICT", "Resource already exists", 409);
  }

  if (
    error instanceof Error &&
    error.message.includes("Record to update not found")
  ) {
    return apiError("NOT_FOUND", "Resource not found", 404);
  }

  console.error("[API_ERROR]", error);
  return apiError(
    "INTERNAL_ERROR",
    "An unexpected error occurred",
    500
  );
}
