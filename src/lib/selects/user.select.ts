export const USER_SAFE_SELECT = {
  id: true,
  email: true,
  phone: true,
  firstName: true,
  lastName: true,
  avatar: true,
  role: true,
  status: true,
  emailVerified: true,
  phoneVerified: true,
  createdAt: true,
  lastLoginAt: true,
} as const;

export const USER_AUTH_SELECT = {
  id: true,
  email: true,
  phone: true,
  firstName: true,
  lastName: true,
  role: true,
  avatar: true,
  status: true,
  passwordHash: true,
  failedLoginAttempts: true,
  lockedUntil: true,
} as const;

export const USER_ID_ONLY = {
  id: true,
} as const;

export const USER_ROLE_CHECK = {
  id: true,
  role: true,
  status: true,
} as const;
