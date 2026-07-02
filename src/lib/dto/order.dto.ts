export interface OrderAddressUserDTO {
  id: string;
  label: string | null;
  fullName: string;
  governorate: string;
  city: string;
  district: string | null;
  street: string | null;
  building: string | null;
  floor: string | null;
  landmark: string | null;
  nearestPoint: string | null;
}

export interface OrderAddressAdminDTO extends OrderAddressUserDTO {
  phone: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function toOrderAddressUserDTO(addr: any): OrderAddressUserDTO | null {
  if (!addr) return null;
  return {
    id: addr.id,
    label: addr.label ?? null,
    fullName: addr.fullName,
    governorate: addr.governorate,
    city: addr.city,
    district: addr.district ?? null,
    street: addr.street ?? null,
    building: addr.building ?? null,
    floor: addr.floor ?? null,
    landmark: addr.landmark ?? null,
    nearestPoint: addr.nearestPoint ?? null,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function toOrderAddressAdminDTO(addr: any): OrderAddressAdminDTO | null {
  if (!addr) return null;
  return {
    ...toOrderAddressUserDTO(addr)!,
    phone: addr.phone,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function toOrderDTO(order: any, isAdmin: boolean) {
  return {
    ...order,
    shippingAddress: isAdmin
      ? toOrderAddressAdminDTO(order.shippingAddress)
      : toOrderAddressUserDTO(order.shippingAddress),
  };
}
