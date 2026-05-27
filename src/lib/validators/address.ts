import { z } from "zod";

const IRAQI_GOVERNORATES = [
  "Baghdad",
  "Basra",
  "Nineveh",
  "Erbil",
  "Sulaymaniyah",
  "Duhok",
  "Kirkuk",
  "Diyala",
  "Anbar",
  "Babylon",
  "Karbala",
  "Najaf",
  "Wasit",
  "Maysan",
  "DhiQar",
  "Muthanna",
  "Qadisiyyah",
  "Saladin",
] as const;

export const createAddressSchema = z.object({
  label: z.string().max(50).optional(),
  fullName: z.string().min(2).max(100),
  phone: z.string().min(10).max(15),
  governorate: z.enum(IRAQI_GOVERNORATES),
  city: z.string().min(2).max(100),
  district: z.string().max(100).optional(),
  street: z.string().max(200).optional(),
  building: z.string().max(100).optional(),
  floor: z.string().max(20).optional(),
  landmark: z.string().max(200).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  isDefault: z.boolean().default(false),
});

export const updateAddressSchema = createAddressSchema.partial();

export type CreateAddressInput = z.infer<typeof createAddressSchema>;
export type UpdateAddressInput = z.infer<typeof updateAddressSchema>;
