const swaggerSpec = {
  openapi: "3.0.3",
  info: {
    title: "Store API",
    version: "1.0.0",
    description:
      "REST API for the e-commerce store. Use the **Authorize** button to add your Bearer token.",
  },
  servers: [{ url: "/api/v1", description: "API v1" }],
  components: {
    securitySchemes: {
      bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
    },
    schemas: {
      Error: {
        type: "object",
        properties: {
          success: { type: "boolean", example: false },
          error: {
            type: "object",
            properties: {
              code: { type: "string" },
              message: { type: "string" },
            },
          },
        },
      },
      Pagination: {
        type: "object",
        properties: {
          page: { type: "integer" },
          limit: { type: "integer" },
          total: { type: "integer" },
          totalPages: { type: "integer" },
          hasNext: { type: "boolean" },
          hasPrev: { type: "boolean" },
        },
      },
      User: {
        type: "object",
        properties: {
          id: { type: "string" },
          email: { type: "string", nullable: true },
          phone: { type: "string", nullable: true },
          firstName: { type: "string" },
          lastName: { type: "string" },
          role: { type: "string", enum: ["CUSTOMER", "ADMIN", "SUPER_ADMIN"] },
          status: { type: "string" },
          avatar: { type: "string", nullable: true },
          phoneVerified: { type: "boolean" },
          emailVerified: { type: "boolean" },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      Product: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          nameAr: { type: "string", nullable: true },
          slug: { type: "string" },
          price: { type: "number" },
          compareAtPrice: { type: "number", nullable: true },
          stock: { type: "integer" },
          isActive: { type: "boolean" },
          isFeatured: { type: "boolean" },
          avgRating: { type: "number" },
          reviewCount: { type: "integer" },
          soldCount: { type: "integer" },
          images: { type: "array", items: { type: "object" } },
          category: { type: "object" },
          brand: { type: "object", nullable: true },
        },
      },
      Order: {
        type: "object",
        properties: {
          id: { type: "string" },
          orderNumber: { type: "string" },
          status: { type: "string", enum: ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"] },
          paymentStatus: { type: "string", enum: ["PENDING", "PAID", "FAILED"] },
          paymentMethod: { type: "string" },
          subtotal: { type: "number" },
          shippingCost: { type: "number" },
          discountAmount: { type: "number" },
          totalAmount: { type: "number" },
          items: { type: "array", items: { type: "object" } },
          shippingAddress: { type: "object" },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      Coupon: {
        type: "object",
        properties: {
          id: { type: "string" },
          code: { type: "string" },
          description: { type: "string", nullable: true },
          discountType: { type: "string", enum: ["PERCENTAGE", "FIXED_AMOUNT", "FREE_SHIPPING"] },
          discountValue: { type: "number" },
          scope: { type: "string", enum: ["ALL", "SPECIFIC_PRODUCTS", "SPECIFIC_CATEGORIES"] },
          minOrderAmount: { type: "number", nullable: true },
          maxDiscount: { type: "number", nullable: true },
          usageLimit: { type: "integer", nullable: true },
          usageCount: { type: "integer" },
          perUserLimit: { type: "integer" },
          isActive: { type: "boolean" },
          startsAt: { type: "string", format: "date-time", nullable: true },
          expiresAt: { type: "string", format: "date-time", nullable: true },
        },
      },
    },
  },
  paths: {
    // ─── AUTH ───────────────────────────────────────────────────────────
    "/auth/register": {
      post: {
        tags: ["Auth"],
        summary: "Register by phone",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["phone", "password", "firstName", "lastName"],
                properties: {
                  phone: { type: "string", example: "07801234567" },
                  password: { type: "string", example: "Test1234!" },
                  firstName: { type: "string", example: "Ahmed" },
                  lastName: { type: "string", example: "Ali" },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "Registered – OTP sent to phone" },
          400: { description: "Validation error", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          409: { description: "Phone already registered" },
        },
      },
    },
    "/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Login with phone/email + password",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["identifier", "password"],
                properties: {
                  identifier: { type: "string", example: "07801234567", description: "Phone or email" },
                  password: { type: "string", example: "Test1234!" },
                  deviceName: { type: "string", example: "iPhone 15" },
                  deviceId: { type: "string", example: "abc123" },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Login successful",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    data: {
                      type: "object",
                      properties: {
                        accessToken: { type: "string" },
                        refreshToken: { type: "string" },
                        user: { $ref: "#/components/schemas/User" },
                      },
                    },
                  },
                },
              },
            },
          },
          401: { description: "Invalid credentials" },
          403: { description: "Account banned/suspended/unverified" },
        },
      },
    },
    "/auth/logout": {
      post: {
        tags: ["Auth"],
        summary: "Logout (revoke refresh token)",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  refreshToken: { type: "string" },
                  logoutAll: { type: "boolean", description: "Revoke all sessions", default: false },
                },
              },
            },
          },
        },
        responses: { 200: { description: "Logged out" } },
      },
    },
    "/auth/refresh": {
      post: {
        tags: ["Auth"],
        summary: "Refresh access token",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["refreshToken"],
                properties: { refreshToken: { type: "string" } },
              },
            },
          },
        },
        responses: {
          200: { description: "New access + refresh tokens" },
          401: { description: "Invalid or expired refresh token" },
        },
      },
    },
    "/auth/verify-phone": {
      post: {
        tags: ["Auth"],
        summary: "Verify phone with OTP",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["phone", "code"],
                properties: {
                  phone: { type: "string", example: "07801234567" },
                  code: { type: "string", example: "123456" },
                },
              },
            },
          },
        },
        responses: { 200: { description: "Phone verified" }, 400: { description: "Invalid OTP" } },
      },
    },
    "/auth/forgot-password": {
      post: {
        tags: ["Auth"],
        summary: "Request password reset",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["identifier"],
                properties: { identifier: { type: "string", example: "07801234567" } },
              },
            },
          },
        },
        responses: { 200: { description: "Reset instructions sent (if account exists)" } },
      },
    },
    "/auth/reset-password": {
      post: {
        tags: ["Auth"],
        summary: "Reset password with token",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["token", "password"],
                properties: {
                  token: { type: "string" },
                  password: { type: "string", example: "NewPass1234!" },
                },
              },
            },
          },
        },
        responses: { 200: { description: "Password reset" }, 400: { description: "Invalid token" } },
      },
    },

    // ─── USER ────────────────────────────────────────────────────────────
    "/user/profile": {
      get: {
        tags: ["User"],
        summary: "Get my profile",
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: "User profile", content: { "application/json": { schema: { $ref: "#/components/schemas/User" } } } } },
      },
      put: {
        tags: ["User"],
        summary: "Update my profile",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  firstName: { type: "string" },
                  lastName: { type: "string" },
                  avatar: { type: "string" },
                  currentPassword: { type: "string" },
                  newPassword: { type: "string" },
                },
              },
            },
          },
        },
        responses: { 200: { description: "Profile updated" } },
      },
    },
    "/user/notifications": {
      get: {
        tags: ["User"],
        summary: "Get my notifications",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 20 } },
        ],
        responses: { 200: { description: "Notifications list" } },
      },
    },

    // ─── PRODUCTS ────────────────────────────────────────────────────────
    "/products": {
      get: {
        tags: ["Products"],
        summary: "List products",
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 20 } },
          { name: "search", in: "query", schema: { type: "string" } },
          { name: "category", in: "query", schema: { type: "string", description: "Category slug" } },
          { name: "brand", in: "query", schema: { type: "string", description: "Brand slug" } },
          { name: "minPrice", in: "query", schema: { type: "number" } },
          { name: "maxPrice", in: "query", schema: { type: "number" } },
          { name: "inStock", in: "query", schema: { type: "boolean" } },
          { name: "featured", in: "query", schema: { type: "boolean" } },
          { name: "sortBy", in: "query", schema: { type: "string", enum: ["createdAt", "price", "name", "soldCount", "avgRating"] } },
          { name: "sortOrder", in: "query", schema: { type: "string", enum: ["asc", "desc"] } },
        ],
        responses: {
          200: {
            description: "Products list",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    data: { type: "array", items: { $ref: "#/components/schemas/Product" } },
                    pagination: { $ref: "#/components/schemas/Pagination" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/products/{id}": {
      get: {
        tags: ["Products"],
        summary: "Get product by ID or slug",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Product details" }, 404: { description: "Not found" } },
      },
    },
    "/products/{id}/reviews": {
      get: {
        tags: ["Reviews"],
        summary: "Get product reviews",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
          { name: "page", in: "query", schema: { type: "integer" } },
          { name: "limit", in: "query", schema: { type: "integer" } },
        ],
        responses: { 200: { description: "Reviews list" } },
      },
      post: {
        tags: ["Reviews"],
        summary: "Create a review",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["productId", "rating"],
                properties: {
                  productId: { type: "string" },
                  rating: { type: "integer", minimum: 1, maximum: 5, example: 5 },
                  title: { type: "string", example: "Great product!" },
                  comment: { type: "string", example: "Very happy with this purchase." },
                },
              },
            },
          },
        },
        responses: { 201: { description: "Review created" }, 409: { description: "Already reviewed" } },
      },
    },

    // ─── CATEGORIES ──────────────────────────────────────────────────────
    "/categories": {
      get: {
        tags: ["Categories"],
        summary: "List categories",
        responses: { 200: { description: "Categories list" } },
      },
    },
    "/categories/{slug}": {
      get: {
        tags: ["Categories"],
        summary: "Get category by slug",
        parameters: [{ name: "slug", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Category details" }, 404: { description: "Not found" } },
      },
    },
    "/categories/{slug}/products": {
      get: {
        tags: ["Categories"],
        summary: "Get products in category",
        parameters: [
          { name: "slug", in: "path", required: true, schema: { type: "string" } },
          { name: "page", in: "query", schema: { type: "integer" } },
          { name: "limit", in: "query", schema: { type: "integer" } },
        ],
        responses: { 200: { description: "Products in category" } },
      },
    },

    // ─── BRANDS ──────────────────────────────────────────────────────────
    "/brands": {
      get: {
        tags: ["Brands"],
        summary: "List brands",
        parameters: [
          { name: "page", in: "query", schema: { type: "integer" } },
          { name: "limit", in: "query", schema: { type: "integer" } },
        ],
        responses: { 200: { description: "Brands list" } },
      },
    },

    // ─── BANNERS ─────────────────────────────────────────────────────────
    "/banners": {
      get: {
        tags: ["Banners"],
        summary: "List active banners",
        responses: { 200: { description: "Banners list" } },
      },
    },

    // ─── CART ─────────────────────────────────────────────────────────────
    "/cart": {
      get: {
        tags: ["Cart"],
        summary: "Get my cart",
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: "Cart contents" } },
      },
      post: {
        tags: ["Cart"],
        summary: "Add item to cart",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["productId", "quantity"],
                properties: {
                  productId: { type: "string" },
                  variantId: { type: "string" },
                  quantity: { type: "integer", minimum: 1, example: 1 },
                },
              },
            },
          },
        },
        responses: { 200: { description: "Item added" }, 400: { description: "Insufficient stock" } },
      },
      delete: {
        tags: ["Cart"],
        summary: "Clear cart",
        security: [{ bearerAuth: [] }],
        responses: { 204: { description: "Cart cleared" } },
      },
    },
    "/cart/{itemId}": {
      patch: {
        tags: ["Cart"],
        summary: "Update cart item quantity",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "itemId", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["quantity"],
                properties: { quantity: { type: "integer", minimum: 1, example: 2 } },
              },
            },
          },
        },
        responses: { 200: { description: "Quantity updated" } },
      },
      delete: {
        tags: ["Cart"],
        summary: "Remove cart item",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "itemId", in: "path", required: true, schema: { type: "string" } }],
        responses: { 204: { description: "Item removed" } },
      },
    },

    // ─── ORDERS ───────────────────────────────────────────────────────────
    "/orders": {
      get: {
        tags: ["Orders"],
        summary: "Get my orders",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "page", in: "query", schema: { type: "integer" } },
          { name: "limit", in: "query", schema: { type: "integer" } },
        ],
        responses: { 200: { description: "Orders list" } },
      },
      post: {
        tags: ["Orders"],
        summary: "Create order from cart",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["shippingAddressId", "paymentMethod"],
                properties: {
                  shippingAddressId: { type: "string" },
                  paymentMethod: { type: "string", enum: ["CASH_ON_DELIVERY", "BANK_TRANSFER", "CARD"], example: "CASH_ON_DELIVERY" },
                  couponCode: { type: "string", example: "SAVE10" },
                  notes: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "Order created", content: { "application/json": { schema: { $ref: "#/components/schemas/Order" } } } },
          400: { description: "Cart empty / insufficient stock" },
        },
      },
    },
    "/orders/{id}": {
      get: {
        tags: ["Orders"],
        summary: "Get order by ID",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Order details" }, 404: { description: "Not found" } },
      },
    },
    "/orders/{id}/cancel": {
      post: {
        tags: ["Orders"],
        summary: "Cancel order",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["reason"],
                properties: { reason: { type: "string", example: "Changed my mind" } },
              },
            },
          },
        },
        responses: { 200: { description: "Order cancelled" }, 400: { description: "Cannot cancel at this stage" } },
      },
    },

    // ─── COUPONS ──────────────────────────────────────────────────────────
    "/coupons/validate": {
      post: {
        tags: ["Coupons"],
        summary: "Validate a coupon code",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["code"],
                properties: {
                  code: { type: "string", example: "SAVE10" },
                  orderTotal: { type: "number", example: 50000 },
                  productIds: { type: "array", items: { type: "string" } },
                  categoryIds: { type: "array", items: { type: "string" } },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Coupon valid – returns discount details" },
          400: { description: "Invalid coupon / min order not met" },
        },
      },
    },

    // ─── WISHLIST ─────────────────────────────────────────────────────────
    "/wishlist": {
      get: {
        tags: ["Wishlist"],
        summary: "Get my wishlist",
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: "Wishlist items" } },
      },
      post: {
        tags: ["Wishlist"],
        summary: "Add product to wishlist",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["productId"],
                properties: { productId: { type: "string" } },
              },
            },
          },
        },
        responses: { 201: { description: "Added to wishlist" }, 409: { description: "Already in wishlist" } },
      },
      delete: {
        tags: ["Wishlist"],
        summary: "Remove product from wishlist",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["productId"],
                properties: { productId: { type: "string" } },
              },
            },
          },
        },
        responses: { 204: { description: "Removed" } },
      },
    },

    // ─── ADDRESSES ────────────────────────────────────────────────────────
    "/addresses": {
      get: {
        tags: ["Addresses"],
        summary: "Get my addresses",
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: "Addresses list" } },
      },
      post: {
        tags: ["Addresses"],
        summary: "Create address",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["fullName", "phone", "governorate", "city", "addressLine1"],
                properties: {
                  fullName: { type: "string", example: "Ahmed Ali" },
                  phone: { type: "string", example: "07801234567" },
                  governorate: { type: "string", example: "بغداد" },
                  city: { type: "string", example: "الكرادة" },
                  addressLine1: { type: "string", example: "شارع الرشيد، رقم 12" },
                  addressLine2: { type: "string" },
                  isDefault: { type: "boolean", default: false },
                },
              },
            },
          },
        },
        responses: { 201: { description: "Address created" } },
      },
    },
    "/addresses/{id}": {
      get: {
        tags: ["Addresses"],
        summary: "Get address by ID",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Address" }, 404: { description: "Not found" } },
      },
      put: {
        tags: ["Addresses"],
        summary: "Update address",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  fullName: { type: "string" },
                  phone: { type: "string" },
                  governorate: { type: "string" },
                  city: { type: "string" },
                  addressLine1: { type: "string" },
                  isDefault: { type: "boolean" },
                },
              },
            },
          },
        },
        responses: { 200: { description: "Updated" } },
      },
      delete: {
        tags: ["Addresses"],
        summary: "Delete address",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 204: { description: "Deleted" } },
      },
    },

    // ─── ADMIN – PRODUCTS ─────────────────────────────────────────────────
    "/mx-panel/products": {
      get: {
        tags: ["Admin – Products"],
        summary: "[Admin] List all products",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "page", in: "query", schema: { type: "integer" } },
          { name: "limit", in: "query", schema: { type: "integer" } },
          { name: "search", in: "query", schema: { type: "string" } },
          { name: "activeOnly", in: "query", schema: { type: "boolean" } },
        ],
        responses: { 200: { description: "Products list" }, 403: { description: "Forbidden" } },
      },
      post: {
        tags: ["Admin – Products"],
        summary: "[Admin] Create product",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "price", "categoryId"],
                properties: {
                  name: { type: "string", example: "iPhone 15" },
                  nameAr: { type: "string", example: "آيفون 15" },
                  description: { type: "string" },
                  price: { type: "number", example: 850000 },
                  compareAtPrice: { type: "number" },
                  stock: { type: "integer", example: 50 },
                  categoryId: { type: "string" },
                  brandId: { type: "string" },
                  isActive: { type: "boolean", default: true },
                  isFeatured: { type: "boolean", default: false },
                },
              },
            },
          },
        },
        responses: { 201: { description: "Product created" } },
      },
    },
    "/mx-panel/products/{id}": {
      get: {
        tags: ["Admin – Products"],
        summary: "[Admin] Get product",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Product" } },
      },
      put: {
        tags: ["Admin – Products"],
        summary: "[Admin] Update product",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  price: { type: "number" },
                  stock: { type: "integer" },
                  isActive: { type: "boolean" },
                  isFeatured: { type: "boolean" },
                },
              },
            },
          },
        },
        responses: { 200: { description: "Updated" } },
      },
      delete: {
        tags: ["Admin – Products"],
        summary: "[Admin] Delete product (soft)",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 204: { description: "Deleted" } },
      },
    },

    // ─── ADMIN – CATEGORIES ───────────────────────────────────────────────
    "/mx-panel/categories": {
      get: {
        tags: ["Admin – Categories"],
        summary: "[Admin] List categories",
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: "Categories" } },
      },
      post: {
        tags: ["Admin – Categories"],
        summary: "[Admin] Create category",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name"],
                properties: {
                  name: { type: "string", example: "Electronics" },
                  nameAr: { type: "string", example: "إلكترونيات" },
                  slug: { type: "string" },
                  parentId: { type: "string" },
                  isActive: { type: "boolean", default: true },
                },
              },
            },
          },
        },
        responses: { 201: { description: "Created" } },
      },
    },
    "/mx-panel/categories/{id}": {
      get: { tags: ["Admin – Categories"], summary: "[Admin] Get category", security: [{ bearerAuth: [] }], parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { 200: { description: "Category" } } },
      put: { tags: ["Admin – Categories"], summary: "[Admin] Update category", security: [{ bearerAuth: [] }], parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], requestBody: { required: true, content: { "application/json": { schema: { type: "object", properties: { name: { type: "string" }, isActive: { type: "boolean" } } } } } }, responses: { 200: { description: "Updated" } } },
      delete: { tags: ["Admin – Categories"], summary: "[Admin] Delete category", security: [{ bearerAuth: [] }], parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { 204: { description: "Deleted" } } },
    },

    // ─── ADMIN – BRANDS ───────────────────────────────────────────────────
    "/mx-panel/brands": {
      get: { tags: ["Admin – Brands"], summary: "[Admin] List brands", security: [{ bearerAuth: [] }], responses: { 200: { description: "Brands" } } },
      post: {
        tags: ["Admin – Brands"],
        summary: "[Admin] Create brand",
        security: [{ bearerAuth: [] }],
        requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["name"], properties: { name: { type: "string", example: "Apple" }, nameAr: { type: "string" }, logo: { type: "string" }, isActive: { type: "boolean" } } } } } },
        responses: { 201: { description: "Created" } },
      },
    },
    "/mx-panel/brands/{id}": {
      get: { tags: ["Admin – Brands"], summary: "[Admin] Get brand", security: [{ bearerAuth: [] }], parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { 200: { description: "Brand" } } },
      put: { tags: ["Admin – Brands"], summary: "[Admin] Update brand", security: [{ bearerAuth: [] }], parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], requestBody: { required: true, content: { "application/json": { schema: { type: "object", properties: { name: { type: "string" }, isActive: { type: "boolean" } } } } } }, responses: { 200: { description: "Updated" } } },
      delete: { tags: ["Admin – Brands"], summary: "[Admin] Delete brand", security: [{ bearerAuth: [] }], parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { 204: { description: "Deleted" } } },
    },

    // ─── ADMIN – BANNERS ──────────────────────────────────────────────────
    "/mx-panel/banners": {
      get: { tags: ["Admin – Banners"], summary: "[Admin] List banners", security: [{ bearerAuth: [] }], responses: { 200: { description: "Banners" } } },
      post: {
        tags: ["Admin – Banners"],
        summary: "[Admin] Create banner",
        security: [{ bearerAuth: [] }],
        requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["title", "imageUrl"], properties: { title: { type: "string" }, imageUrl: { type: "string" }, link: { type: "string" }, sortOrder: { type: "integer" }, isActive: { type: "boolean" } } } } } },
        responses: { 201: { description: "Created" } },
      },
    },
    "/mx-panel/banners/{id}": {
      get: { tags: ["Admin – Banners"], summary: "[Admin] Get banner", security: [{ bearerAuth: [] }], parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { 200: { description: "Banner" } } },
      put: { tags: ["Admin – Banners"], summary: "[Admin] Update banner", security: [{ bearerAuth: [] }], parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], requestBody: { required: true, content: { "application/json": { schema: { type: "object", properties: { title: { type: "string" }, isActive: { type: "boolean" } } } } } }, responses: { 200: { description: "Updated" } } },
      delete: { tags: ["Admin – Banners"], summary: "[Admin] Delete banner", security: [{ bearerAuth: [] }], parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { 204: { description: "Deleted" } } },
    },

    // ─── ADMIN – ORDERS ───────────────────────────────────────────────────
    "/mx-panel/orders": {
      get: {
        tags: ["Admin – Orders"],
        summary: "[Admin] List all orders",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "page", in: "query", schema: { type: "integer" } },
          { name: "limit", in: "query", schema: { type: "integer" } },
          { name: "status", in: "query", schema: { type: "string", enum: ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"] } },
          { name: "search", in: "query", schema: { type: "string", description: "Order number or user name/phone" } },
        ],
        responses: { 200: { description: "Orders" } },
      },
    },
    "/mx-panel/orders/{id}": {
      get: { tags: ["Admin – Orders"], summary: "[Admin] Get order", security: [{ bearerAuth: [] }], parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { 200: { description: "Order" } } },
      put: {
        tags: ["Admin – Orders"],
        summary: "[Admin] Update order status",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["status"],
                properties: {
                  status: { type: "string", enum: ["CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"] },
                  note: { type: "string" },
                  location: { type: "string" },
                },
              },
            },
          },
        },
        responses: { 200: { description: "Status updated" }, 400: { description: "Invalid transition" } },
      },
      post: {
        tags: ["Admin – Orders"],
        summary: "[Admin] Confirm payment",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: { required: false, content: { "application/json": { schema: { type: "object", properties: { transactionId: { type: "string" } } } } } },
        responses: { 200: { description: "Payment confirmed" } },
      },
    },

    // ─── ADMIN – USERS ────────────────────────────────────────────────────
    "/mx-panel/users": {
      get: {
        tags: ["Admin – Users"],
        summary: "[Admin] List users",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "page", in: "query", schema: { type: "integer" } },
          { name: "limit", in: "query", schema: { type: "integer" } },
          { name: "search", in: "query", schema: { type: "string" } },
          { name: "role", in: "query", schema: { type: "string", enum: ["CUSTOMER", "ADMIN", "SUPER_ADMIN"] } },
          { name: "status", in: "query", schema: { type: "string" } },
        ],
        responses: { 200: { description: "Users list" } },
      },
    },
    "/mx-panel/users/{id}": {
      get: { tags: ["Admin – Users"], summary: "[Admin] Get user", security: [{ bearerAuth: [] }], parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { 200: { description: "User" } } },
      put: {
        tags: ["Admin – Users"],
        summary: "[Admin] Update user (status/role)",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: { required: true, content: { "application/json": { schema: { type: "object", properties: { status: { type: "string", enum: ["ACTIVE", "SUSPENDED", "BANNED"] }, role: { type: "string", enum: ["CUSTOMER", "ADMIN"] } } } } } },
        responses: { 200: { description: "Updated" } },
      },
    },

    // ─── ADMIN – COUPONS ──────────────────────────────────────────────────
    "/mx-panel/coupons": {
      get: {
        tags: ["Admin – Coupons"],
        summary: "[Admin] List coupons",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "page", in: "query", schema: { type: "integer" } },
          { name: "limit", in: "query", schema: { type: "integer" } },
          { name: "search", in: "query", schema: { type: "string" } },
        ],
        responses: { 200: { description: "Coupons list" } },
      },
      post: {
        tags: ["Admin – Coupons"],
        summary: "[Admin] Create coupon",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["code", "discountType", "discountValue"],
                properties: {
                  code: { type: "string", example: "SAVE10" },
                  description: { type: "string" },
                  discountType: { type: "string", enum: ["PERCENTAGE", "FIXED_AMOUNT", "FREE_SHIPPING"], example: "PERCENTAGE" },
                  discountValue: { type: "number", example: 10 },
                  scope: { type: "string", enum: ["ALL", "SPECIFIC_PRODUCTS", "SPECIFIC_CATEGORIES"], default: "ALL" },
                  minOrderAmount: { type: "number", example: 20000 },
                  maxDiscount: { type: "number" },
                  usageLimit: { type: "integer" },
                  perUserLimit: { type: "integer", default: 1 },
                  isActive: { type: "boolean", default: true },
                  startsAt: { type: "string", format: "date-time" },
                  expiresAt: { type: "string", format: "date-time" },
                  productIds: { type: "array", items: { type: "string" } },
                  categoryIds: { type: "array", items: { type: "string" } },
                },
              },
            },
          },
        },
        responses: { 201: { description: "Coupon created", content: { "application/json": { schema: { $ref: "#/components/schemas/Coupon" } } } } },
      },
    },
    "/mx-panel/coupons/{id}": {
      get: { tags: ["Admin – Coupons"], summary: "[Admin] Get coupon", security: [{ bearerAuth: [] }], parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { 200: { description: "Coupon" } } },
      put: {
        tags: ["Admin – Coupons"],
        summary: "[Admin] Update coupon",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: { required: true, content: { "application/json": { schema: { type: "object", properties: { isActive: { type: "boolean" }, expiresAt: { type: "string", format: "date-time" }, discountValue: { type: "number" } } } } } },
        responses: { 200: { description: "Updated" } },
      },
      delete: { tags: ["Admin – Coupons"], summary: "[Admin] Delete coupon", security: [{ bearerAuth: [] }], parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { 204: { description: "Deleted" } } },
    },

    // ─── ADMIN – REVIEWS ──────────────────────────────────────────────────
    "/mx-panel/reviews": {
      get: {
        tags: ["Admin – Reviews"],
        summary: "[Admin] List reviews",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "page", in: "query", schema: { type: "integer" } },
          { name: "search", in: "query", schema: { type: "string" } },
        ],
        responses: { 200: { description: "Reviews" } },
      },
    },
    "/mx-panel/reviews/{id}": {
      put: { tags: ["Admin – Reviews"], summary: "[Admin] Approve review", security: [{ bearerAuth: [] }], parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { 200: { description: "Approved" } } },
      post: {
        tags: ["Admin – Reviews"],
        summary: "[Admin] Reply to review",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["reply"], properties: { reply: { type: "string" } } } } } },
        responses: { 200: { description: "Reply added" } },
      },
      delete: { tags: ["Admin – Reviews"], summary: "[Admin] Delete review", security: [{ bearerAuth: [] }], parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { 204: { description: "Deleted" } } },
    },

    // ─── ADMIN – ANALYTICS ────────────────────────────────────────────────
    "/mx-panel/analytics": {
      get: {
        tags: ["Admin – Analytics"],
        summary: "[Admin] Get dashboard analytics",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "period", in: "query", schema: { type: "string", enum: ["7d", "30d", "90d", "1y"], default: "30d" } },
        ],
        responses: { 200: { description: "Analytics data" } },
      },
    },

    // ─── CRON ─────────────────────────────────────────────────────────────
    "/cron/cleanup": {
      post: {
        tags: ["Cron"],
        summary: "Run cleanup job (expired tokens & carts)",
        parameters: [{ name: "authorization", in: "header", schema: { type: "string", example: "Bearer {CRON_SECRET}" } }],
        responses: { 200: { description: "Cleanup result" }, 401: { description: "Unauthorized" } },
      },
    },
    "/cron/cache-invalidate": {
      post: {
        tags: ["Cron"],
        summary: "Invalidate analytics cache",
        parameters: [{ name: "authorization", in: "header", schema: { type: "string", example: "Bearer {CRON_SECRET}" } }],
        responses: { 200: { description: "Cache cleared" }, 401: { description: "Unauthorized" } },
      },
    },
  },
  tags: [
    { name: "Auth", description: "Authentication & token management" },
    { name: "User", description: "User profile & notifications" },
    { name: "Products", description: "Product catalog" },
    { name: "Categories", description: "Product categories" },
    { name: "Brands", description: "Product brands" },
    { name: "Banners", description: "Homepage banners" },
    { name: "Reviews", description: "Product reviews" },
    { name: "Cart", description: "Shopping cart" },
    { name: "Orders", description: "Order management" },
    { name: "Coupons", description: "Coupon validation" },
    { name: "Wishlist", description: "Wishlist" },
    { name: "Addresses", description: "Shipping addresses" },
    { name: "Admin – Products", description: "🔒 Admin: products" },
    { name: "Admin – Categories", description: "🔒 Admin: categories" },
    { name: "Admin – Brands", description: "🔒 Admin: brands" },
    { name: "Admin – Banners", description: "🔒 Admin: banners" },
    { name: "Admin – Orders", description: "🔒 Admin: orders" },
    { name: "Admin – Users", description: "🔒 Admin: user management" },
    { name: "Admin – Coupons", description: "🔒 Admin: coupon management" },
    { name: "Admin – Reviews", description: "🔒 Admin: review moderation" },
    { name: "Admin – Analytics", description: "🔒 Admin: analytics dashboard" },
    { name: "Cron", description: "Scheduled background jobs" },
  ],
};

export default swaggerSpec;
