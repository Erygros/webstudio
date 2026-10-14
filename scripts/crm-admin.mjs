import { createClient } from "@supabase/supabase-js";
const {
  NEXT_PUBLIC_SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  CRM_ADMIN_EMAIL,
  CRM_BOOTSTRAP_PASSWORD,
} = process.env;
if (
  !NEXT_PUBLIC_SUPABASE_URL ||
  !SUPABASE_SERVICE_ROLE_KEY ||
  !CRM_ADMIN_EMAIL ||
  !CRM_BOOTSTRAP_PASSWORD ||
  CRM_BOOTSTRAP_PASSWORD.length < 12
)
  throw new Error(
    "Supabase-URL, Service-Key, Admin-E-Mail und sicheres Bootstrap-Passwort fehlen.",
  );
const db = createClient(NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});
const { data, error } = await db.auth.admin.createUser({
  email: CRM_ADMIN_EMAIL,
  password: CRM_BOOTSTRAP_PASSWORD,
  email_confirm: true,
});
if (error)
  throw new Error(
    "Konto konnte nicht angelegt werden. Vorhandene Konten nicht automatisch überschreiben.",
  );
const { error: profileError } = await db
  .from("crm_users")
  .insert({ id: data.user.id, name: "Enrico Gross", role: "administrator" });
if (profileError) {
  await db.auth.admin.deleteUser(data.user.id);
  throw new Error(
    "Profil konnte nicht angelegt werden. Migration zuerst ausführen.",
  );
}
console.log(
  "Administratorkonto eingerichtet. Bootstrap-Passwort aus der Umgebung entfernen.",
);
