import { db } from "@/lib/db";
import { Errors } from "@/lib/api/errors";
import type { CreateReviewInput } from "@/lib/validators/review";

// Configuration: Set to true to require verified purchase before allowing reviews
const REQUIRE_VERIFIED_PURCHASE = false;

export class ReviewService {
  static async listByProduct(productId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      db.review.findMany({
        where: { productId, isApproved: true, deletedAt: null },
        include: {
          user: { select: { id: true, firstName: true, lastName: true, avatar: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      db.review.count({ where: { productId, isApproved: true, deletedAt: null } }),
    ]);

    return { reviews, total, page, limit };
  }

  static async create(userId: string, input: CreateReviewInput) {
    const product = await db.product.findUnique({
      where: { id: input.productId, isActive: true, deletedAt: null },
    });
    if (!product) throw Errors.notFound("Product");

    const existingReview = await db.review.findUnique({
      where: { productId_userId: { productId: input.productId, userId } },
    });
    if (existingReview && !existingReview.deletedAt) {
      throw Errors.conflict("You have already reviewed this product");
    }

    const hasOrdered = await db.orderItem.findFirst({
      where: {
        productId: input.productId,
        order: { userId, status: "DELIVERED" },
      },
    });

    // Require verified purchase if configured
    if (REQUIRE_VERIFIED_PURCHASE && !hasOrdered) {
      throw Errors.badRequest("You must purchase this product before reviewing it");
    }

    if (existingReview?.deletedAt) {
      return db.review.update({
        where: { id: existingReview.id },
        data: {
          ...input,
          deletedAt: null,
          isVerified: !!hasOrdered,
          isApproved: false,
        },
      });
    }

    return db.review.create({
      data: {
        ...input,
        userId,
        isVerified: !!hasOrdered,
      },
    });
  }

  static async adminApprove(reviewId: string) {
    const review = await db.review.findUnique({ where: { id: reviewId, deletedAt: null } });
    if (!review) throw Errors.notFound("Review");

    const updated = await db.review.update({
      where: { id: reviewId },
      data: { isApproved: true },
    });

    const stats = await db.review.aggregate({
      where: { productId: review.productId, isApproved: true, deletedAt: null },
      _avg: { rating: true },
      _count: { rating: true },
    });

    await db.product.update({
      where: { id: review.productId },
      data: {
        avgRating: stats._avg.rating || 0,
        reviewCount: stats._count.rating,
      },
    });

    return updated;
  }

  static async adminReply(reviewId: string, reply: string) {
    const review = await db.review.findUnique({ where: { id: reviewId, deletedAt: null } });
    if (!review) throw Errors.notFound("Review");

    return db.review.update({
      where: { id: reviewId },
      data: { adminReply: reply, adminRepliedAt: new Date() },
    });
  }

  static async adminDelete(reviewId: string) {
    const review = await db.review.findUnique({ where: { id: reviewId, deletedAt: null } });
    if (!review) throw Errors.notFound("Review");

    await db.review.update({
      where: { id: reviewId },
      data: { deletedAt: new Date() },
    });

    // Recalculate avgRating and reviewCount after deletion
    if (review.isApproved) {
      const stats = await db.review.aggregate({
        where: { productId: review.productId, isApproved: true, deletedAt: null },
        _avg: { rating: true },
        _count: { rating: true },
      });

      await db.product.update({
        where: { id: review.productId },
        data: {
          avgRating: stats._avg.rating || 0,
          reviewCount: stats._count.rating,
        },
      });
    }

    return { deleted: true };
  }
}
