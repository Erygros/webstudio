import { cookies } from "next/headers";
import { apiSession, apiError } from "@/crm/server/db";
export async function POST(request: Request) {
  try {
    await apiSession(request);
    const jar = await cookies();
    const show = jar.has("crm-work-prompt");
    jar.delete("crm-work-prompt");
    return Response.json(
      { show },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return apiError(error);
  }
}
