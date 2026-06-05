export const APP_CONFIG = {
  name: "Store",
  defaultLocale: "ar" as const,
  apiBaseUrl: process.env.NEXT_PUBLIC_API_URL || "/api/v1",
} as const;
