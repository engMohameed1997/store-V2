import { db } from "@/lib/db";
import { Errors } from "@/lib/api/errors";
import { revokeAllUserTokens } from "@/lib/api/jwt";
import type { UpdateProfileInput, AdminUpdateUserInput } from "@/lib/validators/user";
import { MAX_PAGINATION_LIMIT } from "@/lib/constants/pagination";
import { USER_SAFE_SELECT, USER_ROLE_CHECK } from "@/lib/selects/user.select";
import { toUserDTO } from "@/lib/dto/user.dto";

export class UserService {
  static async getProfile(userId: string) {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: USER_SAFE_SELECT,
    });

    if (!user) throw Errors.notFound("User");
    return toUserDTO(user);
  }

  static async updateProfile(userId: string, input: UpdateProfileInput) {
    const user = await db.user.update({
      where: { id: userId },
      data: input,
      select: USER_SAFE_SELECT,
    });
    return toUserDTO(user);
  }

  static async adminList(filters: {
    search?: string;
    role?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const page = filters.page || 1;
    const limit = Math.min(filters.limit || 20, MAX_PAGINATION_LIMIT);
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { deletedAt: null };

    if (filters.role) {
      const roles = filters.role.split(",").map((r) => r.trim()).filter(Boolean);
      where.role = roles.length === 1 ? roles[0] : { in: roles };
    }
    if (filters.status) where.status = filters.status;
    if (filters.search) {
      where.OR = [
        { firstName: { contains: filters.search, mode: "insensitive" } },
        { lastName: { contains: filters.search, mode: "insensitive" } },
        { email: { contains: filters.search, mode: "insensitive" } },
        { phone: { contains: filters.search } },
      ];
    }

    const [users, total] = await Promise.all([
      db.user.findMany({
        where,
        select: USER_SAFE_SELECT,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      db.user.count({ where }),
    ]);

    return { users: users.map((u) => toUserDTO(u)), total, page, limit };
  }

  static async adminUpdate(userId: string, input: AdminUpdateUserInput, actorId?: string) {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: USER_ROLE_CHECK,
    });
    if (!user) throw Errors.notFound("User");

    // Prevent SUPER_ADMIN from modifying themselves
    if (actorId === userId && user.role === "SUPER_ADMIN") {
      throw Errors.badRequest("SUPER_ADMIN cannot modify their own account");
    }

    // Prevent demoting the last SUPER_ADMIN
    if (user.role === "SUPER_ADMIN" && input.role && input.role !== "SUPER_ADMIN") {
      const superAdminCount = await db.user.count({
        where: { role: "SUPER_ADMIN", deletedAt: null },
      });
      if (superAdminCount <= 1) {
        throw Errors.badRequest("Cannot demote the last super admin");
      }
    }

    // Prevent non-SUPER_ADMIN from upgrading others to SUPER_ADMIN
    if (input.role === "SUPER_ADMIN") {
      const actor = await db.user.findUnique({ where: { id: actorId! }, select: { id: true, role: true } });
      if (!actor || actor.role !== "SUPER_ADMIN") {
        throw Errors.forbidden("Only SUPER_ADMIN can assign SUPER_ADMIN role");
      }
    }

    // Prevent banning/suspending self
    if (actorId === userId && input.status && input.status !== "ACTIVE") {
      throw Errors.badRequest("Cannot change your own status");
    }

    const updated = await db.user.update({
      where: { id: userId },
      data: input,
      select: USER_SAFE_SELECT,
    });

    // Revoke all sessions when user is banned or suspended
    if (input.status === "BANNED" || input.status === "SUSPENDED") {
      await revokeAllUserTokens(userId);
    }

    return toUserDTO(updated);
  }

  static async adminDelete(userId: string, actorId?: string) {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: USER_ROLE_CHECK,
    });
    if (!user) throw Errors.notFound("User");

    // Prevent SUPER_ADMIN from deleting themselves
    if (actorId === userId && user.role === "SUPER_ADMIN") {
      throw Errors.badRequest("SUPER_ADMIN cannot delete their own account");
    }

    if (user.role === "SUPER_ADMIN") {
      throw Errors.forbidden("Cannot delete super admin");
    }

    await db.user.update({
      where: { id: userId },
      data: { deletedAt: new Date(), status: "BANNED" },
    });
  }
}
