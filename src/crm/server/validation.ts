import { z } from "zod";
import type { Resource } from "@/crm/resources";
export const uuid = z.uuid();
export function validateRow(resource: Resource, raw: unknown, patch = false) {
  const shape: Record<string, z.ZodType> = {};
  for (const field of resource.fields) {
    let schema: z.ZodType;
    if (field.relation) schema = z.uuid();
    else if (field.type === "checkbox") schema = z.boolean();
    else if (field.type === "number")
      schema = z.coerce.number().finite().min(0).max(999999999);
    else if (field.type === "json") schema = z.record(z.string(), z.unknown());
    else if (field.options)
      schema = z.enum(field.options as [string, ...string[]]);
    else if (field.type === "email") schema = z.email().max(254);
    else if (field.type === "url")
      schema = z
        .url()
        .refine((v) => /^https?:\/\//.test(v), "Nur HTTP(S)-Adressen.");
    else if (field.type === "datetime-local")
      schema = z.iso.datetime({ offset: true });
    else if (field.type === "date") schema = z.iso.date();
    else
      schema = z
        .string()
        .trim()
        .max(field.type === "textarea" ? 20000 : 500)
        .min(field.required ? 1 : 0);
    if (!field.required || patch)
      schema = z.union([schema, z.literal(""), z.null()]).optional();
    shape[field.key] = schema;
  }
  const result = z.object(shape).strict().parse(raw);
  for (const field of resource.fields)
    if (
      result[field.key] === "" &&
      ["date", "datetime-local", "select", "number"].includes(field.type || "")
    )
      result[field.key] = null;
  return result;
}
