import { NextResponse } from "next/server";
import { formReady, makeToken } from "@/server/form-security";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  const enabled = formReady();
  return NextResponse.json(
    {
      enabled,
      token: enabled ? makeToken() : null,
      ...(!enabled
        ? {
            message:
              "Das Formular ist momentan nicht erreichbar. Bitte kontaktiere uns per E-Mail oder Telefon.",
          }
        : {}),
    },
    { status: enabled ? 200 : 503, headers: { "Cache-Control": "no-store" } },
  );
}
