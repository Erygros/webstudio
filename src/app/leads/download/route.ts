import { timingSafeEqual } from "node:crypto";
import { serviceDb } from "@/crm/server/db";
import { tokenHash, type LeadOrder } from "@/crm/server/lead-shop";
import { allowed } from "@/server/form-security";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const headers = {
  "Cache-Control": "private, no-store, max-age=0",
  "Referrer-Policy": "no-referrer",
  "X-Robots-Tag": "noindex, nofollow",
  "X-Content-Type-Options": "nosniff",
};
export async function GET(request: Request) {
  try {
    const url = new URL(request.url),
      id = url.searchParams.get("id") || "",
      token = url.searchParams.get("token") || "";
    if (!/^[a-f0-9-]{36}$/.test(id) || !/^[a-f0-9]{64}$/.test(token))
      throw new Error();
    if (!(await allowed(`lead-download:${id}`, 100, 3600)))
      return new Response("Bitte später erneut versuchen.", {
        status: 429,
        headers,
      });
    const db = serviceDb(),
      { data, error } = await db
        .from("crm_lead_orders")
        .select("*")
        .eq("id", id)
        .single();
    if (error || !data) throw new Error();
    const row = data as LeadOrder,
      hash = tokenHash(token);
    if (
      !row.paid_at ||
      row.status !== "Bereitgestellt" ||
      row.revoked ||
      !row.file_path ||
      !row.token_hash ||
      !row.token_expires_at ||
      Date.parse(row.token_expires_at) <= Date.now() ||
      !timingSafeEqual(Buffer.from(hash), Buffer.from(row.token_hash))
    )
      throw new Error();
    const file = await db.storage
      .from("lead-shop-private")
      .download(row.file_path);
    if (file.error || !file.data) throw new Error();
    const bytes = Buffer.from(await file.data.arrayBuffer());
    if (tokenHash(bytes.toString("utf8")) !== row.file_sha256)
      throw new Error();
    // Recheck authorization after storage retrieval, before returning the bytes.
    const check = await db
      .from("crm_lead_orders")
      .select("revoked,status,token_hash")
      .eq("id", id)
      .single();
    if (
      check.error ||
      check.data.revoked ||
      check.data.status !== "Bereitgestellt" ||
      check.data.token_hash !== hash
    )
      throw new Error();
    const audit = await db
      .from("crm_lead_shop_events")
      .insert({ order_id: id, action: "download.served" });
    if (audit.error) throw new Error();
    return new Response(bytes, {
      headers: {
        ...headers,
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${row.reference}-${row.quantity}-Firmenkontakte.csv"`,
      },
    });
  } catch {
    return new Response(
      "Dieser Downloadlink ist ungültig, abgelaufen oder nicht freigegeben. Bitte kontaktieren Sie Webstudio Expert.",
      { status: 404, headers },
    );
  }
}
