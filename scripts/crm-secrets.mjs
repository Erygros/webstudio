import fs from "node:fs";
import crypto from "node:crypto";
import webPush from "web-push";
const file = ".env.local";
let text = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "";
for (const name of ["FORM_SECRET", "CRM_ENCRYPTION_KEY", "CRON_SECRET"])
  if (!new RegExp("^" + name + "=.+$", "m").test(text))
    text += "\n" + name + "=" + crypto.randomBytes(32).toString("hex");
if (
  !/^NEXT_PUBLIC_VAPID_KEY=.+$/m.test(text) ||
  !/^VAPID_PRIVATE_KEY=.+$/m.test(text)
) {
  const keys = webPush.generateVAPIDKeys();
  text +=
    "\nNEXT_PUBLIC_VAPID_KEY=" +
    keys.publicKey +
    "\nVAPID_PRIVATE_KEY=" +
    keys.privateKey;
}
fs.writeFileSync(file, text.trim() + "\n");
console.log(
  "CRM-Geheimnisse in .env.local erzeugt; keine Zugangsdaten ausgegeben.",
);
