# Store API Documentation

## Base URL
```
http://localhost:3000/api/v1
```

## Authentication
All protected endpoints require `Authorization: Bearer <access_token>` header.

---

## Auth Endpoints (Rate: 10 req/15min)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register (phone or email) |
| POST | `/auth/login` | Login → returns access + refresh tokens |
| POST | `/auth/refresh` | Refresh token rotation |
| POST | `/auth/logout` | Revoke refresh token family |
| POST | `/auth/verify-phone` | Verify OTP code |
| POST | `/auth/forgot-password` | Request password reset |
| POST | `/auth/reset-password` | Reset password with token |

### Register by Phone (Iraqi)
```json
POST /auth/register
{
  "phone": "07XXXXXXXXX",
  "password": "StrongP@ss1",
  "firstName": "Ahmed",
  "lastName": "Ali"
}
```

### Register by Email
```json
POST /auth/register
{
  "email": "user@example.com",
  "password": "StrongP@ss1",
  "firstName": "Ahmed",
  "lastName": "Ali"
}
```

### Login
```json
POST /auth/login
{
  "identifier": "07XXXXXXXXX" or "user@example.com",
  "password": "StrongP@ss1",
  "deviceName": "iPhone 15",
  "deviceId": "unique-device-id"
}
```

---

## Public Endpoints (No Auth)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/products` | List products (paginated, filterable) |
| GET | `/products/:id` | Get product detail |
| GET | `/products/:id/reviews` | Get product reviews |
| GET | `/categories` | List categories (tree) |
| GET | `/categories/:slug` | Category detail |
| GET | `/categories/:slug/products` | Products by category |
| GET | `/brands` | List brands |
| GET | `/banners` | Active banners |

### Product Filters
```
GET /products?search=keyword&category=slug&brand=slug&minPrice=100&maxPrice=5000&inStock=true&featured=true&sortBy=price&sortOrder=asc&page=1&limit=20
```

---

## Protected Endpoints (Auth Required)

### Cart
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/cart` | Get cart |
| POST | `/cart` | Add item |
| DELETE | `/cart` | Clear cart |
| PUT | `/cart/:itemId` | Update quantity |
| DELETE | `/cart/:itemId` | Remove item |

### Orders
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/orders` | My orders |
| POST | `/orders` | Create order |
| GET | `/orders/:id` | Order detail |
| POST | `/orders/:id/cancel` | Cancel order |

### Wishlist
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/wishlist` | My wishlist |
| POST | `/wishlist` | Toggle product |

### Addresses
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/addresses` | My addresses |
| POST | `/addresses` | Add address |
| GET | `/addresses/:id` | Address detail |
| PUT | `/addresses/:id` | Update address |
| DELETE | `/addresses/:id` | Delete address |

### Profile
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/user/profile` | My profile |
| PUT | `/user/profile` | Update profile |
| GET | `/user/notifications` | Notifications |
| PUT | `/user/notifications` | Mark as read |

### Coupons
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/coupons/validate` | Validate coupon |

---

## Admin Endpoints (ADMIN/SUPER_ADMIN only)
Path: `/api/v1/mx-panel/...`

### Products
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/mx-panel/products` | List all (inc. inactive) |
| POST | `/mx-panel/products` | Create product |
| GET | `/mx-panel/products/:id` | Get product |
| PUT | `/mx-panel/products/:id` | Update product |
| DELETE | `/mx-panel/products/:id` | Soft delete |

### Categories, Brands, Orders, Users, Coupons, Reviews, Banners
Same CRUD pattern under `/mx-panel/...`

### Analytics
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/mx-panel/analytics` | Dashboard stats |

---

## Response Format

### Success
```json
{
  "success": true,
  "data": { ... },
  "message": "optional"
}
```

### Paginated
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### Error
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input",
    "details": [...]
  }
}
```

## Security Headers (Applied Automatically)
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security: max-age=31536000`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Cache-Control: no-store` (API responses)
- `X-Request-ID` (unique per request)

## Rate Limits
| Tier | Limit | Window |
|------|-------|--------|
| default | 60 req | 1 min |
| auth | 10 req | 15 min |
| strict | 5 req | 1 min |
| search | 30 req | 1 min |
