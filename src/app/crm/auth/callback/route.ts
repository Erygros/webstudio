import { crmDb } from "@/crm/server/db";
import { NextResponse } from "next/server";
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  if (code) {
    const db = await crmDb();
    const { error } = await db.auth.exchangeCodeForSession(code);
    if (!error)
      return NextResponse.redirect(
        new URL(
          url.searchParams.get("next") === "/crm/passwort"
            ? "/crm/passwort"
            : "/crm",
          request.url,
        ),
      );
  }
  return NextResponse.redirect(new URL("/crm/login?error=link", request.url));
}
