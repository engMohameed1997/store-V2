export const ORDER_ADDRESS_USER_VIEW = {
  select: {
    id: true,
    label: true,
    fullName: true,
    governorate: true,
    city: true,
    district: true,
    street: true,
    building: true,
    floor: true,
    landmark: true,
    nearestPoint: true,
  },
} as const;

export const ORDER_ADDRESS_ADMIN_VIEW = {
  select: {
    id: true,
    label: true,
    fullName: true,
    phone: true,
    governorate: true,
    city: true,
    district: true,
    street: true,
    building: true,
    floor: true,
    landmark: true,
    nearestPoint: true,
  },
} as const;
