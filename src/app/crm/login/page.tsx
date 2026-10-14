import { crmConfigured } from "@/crm/server/db";
import { Login } from "@/crm/components/login";
export default function Page() {
  return <Login configured={crmConfigured()} />;
}
