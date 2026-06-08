import { z } from "zod";
import { isValidGovernorate, isValidDistrict } from "@/lib/data/iraq-locations";

export const createAddressSchema = z.object({
  label: z.string().max(50).optional(),
  fullName: z.string().min(2).max(100),
  phone: z.string().min(10).max(15),
  governorate: z.string().min(2).max(50).refine(isValidGovernorate, {
    message: "المحافظة غير صالحة",
  }),
  city: z.string().min(2).max(100),
  district: z.string().max(100).optional(),
  nearestPoint: z.string().max(200).optional(),
  street: z.string().max(200).optional(),
  building: z.string().max(100).optional(),
  floor: z.string().max(20).optional(),
  landmark: z.string().max(200).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  isDefault: z.boolean().default(false),
}).refine(
  (data) => {
    if (data.city && data.governorate) {
      return isValidDistrict(data.governorate, data.city);
    }
    return true;
  },
  { message: "القضاء غير صالح لهذه المحافظة", path: ["city"] }
);

export const updateAddressSchema = z.object({
  label: z.string().max(50).optional(),
  fullName: z.string().min(2).max(100).optional(),
  phone: z.string().min(10).max(15).optional(),
  governorate: z.string().min(2).max(50).optional(),
  city: z.string().min(2).max(100).optional(),
  district: z.string().max(100).optional(),
  nearestPoint: z.string().max(200).optional(),
  street: z.string().max(200).optional(),
  building: z.string().max(100).optional(),
  floor: z.string().max(20).optional(),
  landmark: z.string().max(200).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  isDefault: z.boolean().optional(),
});

export type CreateAddressInput = z.infer<typeof createAddressSchema>;
export type UpdateAddressInput = z.infer<typeof updateAddressSchema>;
