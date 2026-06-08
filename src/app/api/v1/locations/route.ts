import { NextRequest } from "next/server";
import { publicRoute } from "@/lib/api/route-handler";
import { apiSuccess } from "@/lib/api/response";
import {
  IRAQ_GOVERNORATES,
  getDistricts,
  getSubDistricts,
} from "@/lib/data/iraq-locations";

export const GET = publicRoute(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const governorate = searchParams.get("governorate");
  const district = searchParams.get("district");

  // If both governorate and district provided, return sub-districts
  if (governorate && district) {
    const subDistricts = getSubDistricts(governorate, district);
    return apiSuccess({ subDistricts });
  }

  // If governorate provided, return its districts
  if (governorate) {
    const districts = getDistricts(governorate);
    return apiSuccess({ districts });
  }

  // Return all governorates with their districts
  const governorates = IRAQ_GOVERNORATES.map((g) => ({
    name: g.name,
    districts: g.districts.map((d) => ({
      name: d.name,
      subDistricts: d.subDistricts.map((s) => s.name),
    })),
  }));

  return apiSuccess({ governorates });
});
