import { NextResponse } from "next/server";
import swaggerSpec from "@/lib/swagger";

export const dynamic = "force-static";

export function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(swaggerSpec);
}
