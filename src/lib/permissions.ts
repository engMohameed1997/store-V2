import type { UserRole } from "@/generated/prisma/client";

// ─── Role-based Permissions Config ──────────────────────────────
// Maps each admin role to the panel pages and API resources they can access.

export interface RolePermissions {
  /** Allowed sidebar nav paths (exact prefix match) */
  allowedPages: string[];
  /** Human-readable label */
  label: string;
  labelAr: string;
}

/**
 * Defines which mx-panel pages each role can access.
 * SUPER_ADMIN and ADMIN have full access (not listed here — they bypass checks).
 */
const ROLE_PERMISSIONS: Record<string, RolePermissions> = {
  SUPER_ADMIN: {
    label: "Super Admin",
    labelAr: "مدير النظام",
    allowedPages: ["*"], // wildcard = full access
  },
  ADMIN: {
    label: "Admin",
    labelAr: "مدير",
    allowedPages: ["*"],
  },
  SALES: {
    label: "Sales",
    labelAr: "موظف مبيعات",
    allowedPages: [
      "/mx-panel",           // dashboard (read-only)
      "/mx-panel/orders",
      "/mx-panel/users",     // customers only
      "/mx-panel/coupons",
      "/mx-panel/invoices",
      "/mx-panel/reports",
    ],
  },
  WAREHOUSE: {
    label: "Warehouse",
    labelAr: "موظف مخزن",
    allowedPages: [
      "/mx-panel",           // dashboard (read-only)
      "/mx-panel/products",
      "/mx-panel/categories",
      "/mx-panel/brands",
      "/mx-panel/branches",
      "/mx-panel/shipping",
    ],
  },
  CUSTOMER_SERVICE: {
    label: "Customer Service",
    labelAr: "خدمة العملاء",
    allowedPages: [
      "/mx-panel",           // dashboard (read-only)
      "/mx-panel/tickets",
      "/mx-panel/orders",    // read-only
      "/mx-panel/reviews",
      "/mx-panel/users",     // customers only
    ],
  },
};

/**
 * Check if a role has access to a specific page path.
 */
export function canAccessPage(role: string, path: string): boolean {
  const perms = ROLE_PERMISSIONS[role];
  if (!perms) return false;
  if (perms.allowedPages.includes("*")) return true;
  return perms.allowedPages.some((allowed) => {
    if (path === allowed) return true;
    return path.startsWith(allowed + "/");
  });
}

/**
 * Filter nav items based on user role.
 */
export function filterNavItemsByRole<T extends { href: string }>(
  items: T[],
  role: string
): T[] {
  const perms = ROLE_PERMISSIONS[role];
  if (!perms) return [];
  if (perms.allowedPages.includes("*")) return items;
  return items.filter((item) => canAccessPage(role, item.href));
}

/**
 * Get the permissions config for a role.
 */
export function getRolePermissions(role: string): RolePermissions | null {
  return ROLE_PERMISSIONS[role] || null;
}

/**
 * Check if a role has full (admin-level) access.
 */
export function hasFullAccess(role: string): boolean {
  const perms = ROLE_PERMISSIONS[role];
  return !!perms && perms.allowedPages.includes("*");
}

/**
 * All staff roles (non-customer).
 */
export const STAFF_ROLES: UserRole[] = [
  "SUPER_ADMIN",
  "ADMIN",
  "SALES",
  "WAREHOUSE",
  "CUSTOMER_SERVICE",
];

/**
 * Roles that can manage users (create/update/delete staff).
 */
export const USER_MANAGEMENT_ROLES: UserRole[] = ["SUPER_ADMIN"];
