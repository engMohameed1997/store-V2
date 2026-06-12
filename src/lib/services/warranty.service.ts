import { db } from "@/lib/db";
import { Errors } from "@/lib/api/errors";
import { MAX_PAGINATION_LIMIT } from "@/lib/constants/pagination";

export class WarrantyService {
  /**
   * Automatically creates warranty records for all eligible items in an order.
   * This is typically called when the order is marked as SHIPPED or DELIVERED.
   */
  static async activateWarrantiesForOrder(orderId: string, tx?: any) {
    const prisma = tx || db;

    // Fetch the order with its items and products
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: true,
            warranty: true,
          },
        },
      },
    });

    if (!order) throw Errors.notFound("Order");

    const startDate = new Date(); // Warranty starts from activation date

    for (const item of order.items) {
      // If a warranty already exists or if product is null, skip
      if (item.warranty || !item.product) continue;

      const duration = item.product.warrantyDuration;
      const unit = item.product.warrantyUnit;
      const coverage = item.product.warrantyCoverage;

      // Only create warranty if duration and unit are set on the product
      if (duration && unit) {
        const endDate = new Date(startDate);
        if (unit.toUpperCase() === "MONTHS") {
          endDate.setMonth(endDate.getMonth() + duration);
        } else if (unit.toUpperCase() === "DAYS") {
          endDate.setDate(endDate.getDate() + duration);
        } else if (unit.toUpperCase() === "YEARS") {
          endDate.setFullYear(endDate.getFullYear() + duration);
        }

        await prisma.warranty.create({
          data: {
            orderItemId: item.id,
            productName: item.productName,
            duration,
            unit: unit.toUpperCase(),
            coverage,
            startDate,
            endDate,
            status: "ACTIVE",
          },
        });
      }
    }
  }

  /**
   * Lists warranties with filters for admin
   */
  static async list(filters: {
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const page = filters.page || 1;
    const limit = Math.min(filters.limit || 20, MAX_PAGINATION_LIMIT);
    const skip = (page - 1) * limit;

    const where: any = {};
    if (filters.status) where.status = filters.status;
    if (filters.search) {
      where.OR = [
        { productName: { contains: filters.search, mode: "insensitive" } },
        { serialNumber: { contains: filters.search, mode: "insensitive" } },
        { orderItem: { order: { orderNumber: { contains: filters.search, mode: "insensitive" } } } },
        { orderItem: { order: { user: { firstName: { contains: filters.search, mode: "insensitive" } } } } },
      ];
    }

    const [warranties, total] = await Promise.all([
      db.warranty.findMany({
        where,
        include: {
          orderItem: {
            include: {
              order: {
                include: {
                  user: { select: { id: true, firstName: true, lastName: true, phone: true } },
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      db.warranty.count({ where }),
    ]);

    return { warranties, total, page, limit };
  }

  /**
   * Get warranty by ID
   */
  static async getById(id: string) {
    const warranty = await db.warranty.findUnique({
      where: { id },
      include: {
        orderItem: {
          include: {
            order: {
              include: {
                user: { select: { id: true, firstName: true, lastName: true, phone: true } },
              },
            },
          },
        },
      },
    });

    if (!warranty) throw Errors.notFound("Warranty");
    return warranty;
  }

  /**
   * Update warranty serial number, status, or coverage details
   */
  static async update(
    id: string,
    data: {
      serialNumber?: string;
      status?: string;
      coverage?: string;
      endDate?: Date;
    }
  ) {
    const warranty = await db.warranty.findUnique({ where: { id } });
    if (!warranty) throw Errors.notFound("Warranty");

    return db.warranty.update({
      where: { id },
      data,
    });
  }

  /**
   * Lists active warranties for a specific customer
   */
  static async getCustomerWarranties(userId: string) {
    return db.warranty.findMany({
      where: {
        orderItem: {
          order: {
            userId,
          },
        },
      },
      include: {
        orderItem: {
          select: {
            id: true,
            orderId: true,
            order: {
              select: {
                orderNumber: true,
                createdAt: true,
              },
            },
          },
        },
      },
      orderBy: { endDate: "desc" },
    });
  }
}
