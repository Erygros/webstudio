import { NextResponse } from "next/server";
import { formReady, makeToken } from "@/server/form-security";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  return NextResponse.json(
    { enabled: formReady(), token: formReady() ? makeToken() : null },
    { headers: { "Cache-Control": "no-store" } },
  );
}
