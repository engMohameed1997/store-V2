export interface AddressDTO {
  id: string;
  label: string | null;
  fullName: string;
  phone: string;
  governorate: string;
  city: string;
  district: string | null;
  street: string | null;
  building: string | null;
  floor: string | null;
  landmark: string | null;
  nearestPoint: string | null;
  isDefault: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function toAddressDTO(addr: any): AddressDTO {
  return {
    id: addr.id,
    label: addr.label ?? null,
    fullName: addr.fullName,
    phone: addr.phone,
    governorate: addr.governorate,
    city: addr.city,
    district: addr.district ?? null,
    street: addr.street ?? null,
    building: addr.building ?? null,
    floor: addr.floor ?? null,
    landmark: addr.landmark ?? null,
    nearestPoint: addr.nearestPoint ?? null,
    isDefault: addr.isDefault,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function toAddressDTOList(addresses: any[]): AddressDTO[] {
  return addresses.map(toAddressDTO);
}
