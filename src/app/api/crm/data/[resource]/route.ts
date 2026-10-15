import { resources } from "@/crm/resources";
import { apiSession, apiError } from "@/crm/server/db";
import { validateRow, uuid } from "@/crm/server/validation";
export async function GET(
  request: Request,
  { params }: { params: Promise<{ resource: string }> },
) {
  try {
    const { resource: key } = await params;
    const resource = resources[key];
    if (!resource) throw new Error("Unbekannter Bereich.");
    const { db } = await apiSession(request);
    const url = new URL(request.url);
    const offset = Math.max(
      0,
      Math.min(100000, Number(url.searchParams.get("offset") || 0) || 0),
    );
    const sort = url.searchParams.get("order") || "created_at";
    const order =
      resource.columns.includes(sort) || sort === "created_at"
        ? sort
        : "created_at";
    let query = db
      .from(resource.table)
      .select("*", { count: "exact" })
      .order(order, { ascending: url.searchParams.get("asc") === "true" })
      .range(offset, offset + 49);
    if (key === "kunden") query = query.eq("is_customer", true);
    if (key === "dokumente" && url.searchParams.has("inquiry")) {
      const inquiry = url.searchParams.get("inquiry") || "";
      if (!/^[a-f0-9]{64}$/.test(inquiry))
        throw new Error("Ungültige Anfragezuordnung.");
      query = query.like("path", `website/${inquiry}/%`);
    }
    if (
      key === "emails" &&
      ["inbox", "sent", "draft", "archive", "unknown"].includes(
        url.searchParams.get("folder") || "",
      )
    )
      query = query.eq("folder", url.searchParams.get("folder"));
    if (url.searchParams.get("id"))
      query = query.eq("id", uuid.parse(url.searchParams.get("id")));
    const pk = url.searchParams.get("parentKey") || resource.parent;
    if (
      url.searchParams.get("parent") &&
      pk &&
      ((["company_id", "project_id", "email_id"].includes(pk) &&
        resource.fields.some((f) => f.key === pk)) ||
        (key === "historie" && pk === "entity_id"))
    )
      query = query.eq(pk, uuid.parse(url.searchParams.get("parent")));
    if (
      url.searchParams.get("status") &&
      resource.fields.some((f) => f.key === "status")
    )
      query = query.eq("status", url.searchParams.get("status"));
    if (key === "telefonie" && url.searchParams.get("sid"))
      query = query.eq("provider_sid", url.searchParams.get("sid"));
    const q = url.searchParams.get("q")?.slice(0, 150);
    if (q && resource.search !== "id")
      query = query.ilike(resource.search, `%${q.replace(/[%_\\]/g, "\\$&")}%`);
    const { data, error, count } = await query;
    if (error) throw new Error(error.message);
    return Response.json(
      { rows: data || [], count },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (e) {
    return apiError(e);
  }
}
export async function POST(
  request: Request,
  { params }: { params: Promise<{ resource: string }> },
) {
  try {
    const { resource: key } = await params;
    const resource = resources[key];
    if (
      !resource ||
      !resource.roles.length ||
      ["dokumente", "benachrichtigungen", "anfragen", "historie"].includes(key)
    )
      throw new Error("403:Hier können keine Datensätze angelegt werden.");
    const { db, user } = await apiSession(request, resource.roles);
    const raw = await request.json();
    const row = validateRow(resource, raw);
    for (const [key, value] of Object.entries(row))
      if (value === null || value === "") delete row[key];
    if (key === "kunden") row.is_customer = true;
    if (resource.table === "crm_companies") row.created_by = user.id;
    if (resource.table === "crm_companies") {
      let duplicate = db
        .from("crm_companies")
        .select("id")
        .eq("name", String(row.name));
      if (row.city) duplicate = duplicate.eq("city", String(row.city));
      const { data: found } = await duplicate.limit(1);
      if (found?.length)
        throw new Error(
          "409:Ein Unternehmen mit diesem Namen/Ort existiert bereits. Bitte den vorhandenen Datensatz verwenden.",
        );
    }
    if (key === "telefonie") {
      row.user_id = user.id;
    }
    if (key === "zeiten") row.user_id = user.id;
    const { data, error } = await db
      .from(resource.table)
      .insert(row)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return Response.json({ row: data }, { status: 201 });
  } catch (e) {
    return apiError(e);
  }
}
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ resource: string }> },
) {
  try {
    const { resource: key } = await params;
    const resource = resources[key];
    if (!resource || !resource.roles.length)
      throw new Error("403:Änderung nicht erlaubt.");
    const { db } = await apiSession(request, resource.roles);
    const { id, ...raw } = await request.json();
    const row = validateRow(resource, raw, true);
    const { data, error } = await db
      .from(resource.table)
      .update(row)
      .eq("id", uuid.parse(id))
      .select()
      .single();
    if (error) throw new Error(error.message);
    return Response.json({ row: data });
  } catch (e) {
    return apiError(e);
  }
}
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ resource: string }> },
) {
  try {
    const { resource: key } = await params;
    const resource = resources[key];
    if (
      !resource ||
      [
        "historie",
        "anfragen",
        "dokumente",
        "zahlungen",
        "benachrichtigungen",
      ].includes(key)
    )
      throw new Error("403:Löschen hier nicht erlaubt.");
    const { db } = await apiSession(request, ["administrator"]);
    const { id } = await request.json();
    if (resource.table === "crm_companies") {
      const { count } = await db
        .from("crm_invoices")
        .select("id", { count: "exact", head: true })
        .eq("company_id", id);
      if (count)
        throw new Error(
          "Das Unternehmen besitzt Rechnungen. Bitte archivieren statt löschen.",
        );
    }
    const { error } = await db
      .from(resource.table)
      .delete()
      .eq("id", uuid.parse(id));
    if (error)
      throw new Error(
        "Datensatz ist verknüpft oder darf nicht gelöscht werden.",
      );
    return Response.json({ success: true });
  } catch (e) {
    return apiError(e);
  }
}
