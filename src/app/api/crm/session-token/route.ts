import { apiSession, apiError } from "@/crm/server/db";
export async function GET(request: Request) {
  try {
    const { db } = await apiSession(request);
    const { data } = await db.auth.getSession();
    return Response.json(
      { token: data.session?.access_token },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (e) {
    return apiError(e);
  }
}
