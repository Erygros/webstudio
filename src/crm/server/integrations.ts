import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { serviceDb } from "./db";
export function encrypt(data: unknown) {
  const key = Buffer.from(process.env.CRM_ENCRYPTION_KEY || "", "hex");
  if (key.length !== 32)
    throw new Error("CRM_ENCRYPTION_KEY fehlt (32 Byte hex).");
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const bytes = Buffer.concat([
    cipher.update(JSON.stringify(data), "utf8"),
    cipher.final(),
  ]);
  return Buffer.concat([iv, cipher.getAuthTag(), bytes]).toString("base64");
}
function decrypt(value: string) {
  const key = Buffer.from(process.env.CRM_ENCRYPTION_KEY || "", "hex");
  if (key.length !== 32) throw new Error("Servergeheimnis fehlt.");
  const bytes = Buffer.from(value, "base64");
  const decipher = createDecipheriv("aes-256-gcm", key, bytes.subarray(0, 12));
  decipher.setAuthTag(bytes.subarray(12, 28));
  return JSON.parse(
    Buffer.concat([
      decipher.update(bytes.subarray(28)),
      decipher.final(),
    ]).toString("utf8"),
  ) as Record<string, string>;
}
export async function integration(provider: string) {
  const { data } = await serviceDb()
    .from("crm_integrations")
    .select("encrypted_config,enabled")
    .eq("provider", provider)
    .maybeSingle();
  return data?.enabled && data.encrypted_config
    ? decrypt(data.encrypted_config)
    : {};
}
export async function smtpConfig() {
  const saved = await integration("smtp");
  return {
    host: saved.host || process.env.SMTP_HOST || "",
    port: Number(saved.port || process.env.SMTP_PORT || 587),
    user: saved.user || process.env.SMTP_USER || "",
    password: saved.password || process.env.SMTP_PASSWORD || "",
    from: saved.from || process.env.SMTP_FROM || "kontakt@webstudio-expert.de",
  };
}
export async function imapConfig() {
  const saved = await integration("imap");
  return {
    host: saved.host || process.env.IMAP_HOST || "",
    port: Number(saved.port || process.env.IMAP_PORT || 993),
    user: saved.user || process.env.IMAP_USER || "",
    password: saved.password || process.env.IMAP_PASSWORD || "",
  };
}
export async function voiceConfig() {
  const saved = await integration("twilio");
  return {
    accountSid: saved.accountSid || process.env.TWILIO_ACCOUNT_SID || "",
    authToken: saved.authToken || process.env.TWILIO_AUTH_TOKEN || "",
    apiKey: saved.apiKey || process.env.TWILIO_API_KEY || "",
    apiSecret: saved.apiSecret || process.env.TWILIO_API_SECRET || "",
    appSid: saved.appSid || process.env.TWILIO_TWIML_APP_SID || "",
    callerId: saved.callerId || process.env.TWILIO_CALLER_ID || "",
  };
}
