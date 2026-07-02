export interface UserDTO {
  id: string;
  email: string | null;
  phone: string | null;
  firstName: string;
  lastName: string;
  avatar: string | null;
  role: string;
  status: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  createdAt: string;
  lastLoginAt: string | null;
}

export function toUserDTO<T extends Record<string, unknown>>(user: T): UserDTO {
  return {
    id: user.id as string,
    email: (user.email as string) ?? null,
    phone: (user.phone as string) ?? null,
    firstName: user.firstName as string,
    lastName: user.lastName as string,
    avatar: (user.avatar as string) ?? null,
    role: user.role as string,
    status: user.status as string,
    emailVerified: user.emailVerified as boolean,
    phoneVerified: user.phoneVerified as boolean,
    createdAt:
      user.createdAt instanceof Date
        ? (user.createdAt as Date).toISOString()
        : (user.createdAt as string),
    lastLoginAt:
      user.lastLoginAt instanceof Date
        ? (user.lastLoginAt as Date).toISOString()
        : ((user.lastLoginAt as string) ?? null),
  };
}

export interface AuthUserDTO {
  id: string;
  email: string | null;
  phone: string | null;
  firstName: string;
  lastName: string;
  role: string;
  avatar: string | null;
}

export function toAuthUserDTO<T extends Record<string, unknown>>(
  user: T
): AuthUserDTO {
  return {
    id: user.id as string,
    email: (user.email as string) ?? null,
    phone: (user.phone as string) ?? null,
    firstName: user.firstName as string,
    lastName: user.lastName as string,
    role: user.role as string,
    avatar: (user.avatar as string) ?? null,
  };
}
