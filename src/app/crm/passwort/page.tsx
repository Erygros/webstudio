import { session } from "@/crm/server/db";
import { Login } from "@/crm/components/login";
export default async function Page() {
  await session();
  return <Login configured passwordMode />;
}
