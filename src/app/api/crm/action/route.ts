import { runAction } from "@/crm/server/actions";
import { apiError } from "@/crm/server/db";
export async function POST(request: Request) {
  try {
    return Response.json(await runAction(request));
  } catch (e) {
    return apiError(e);
  }
}
