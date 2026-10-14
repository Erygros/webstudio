export const timeZone = "Europe/Berlin";
export function berlinDate(date = new Date()) {
  return new Intl.DateTimeFormat("sv-SE", { timeZone }).format(date);
}
export function berlinInput(value: string) {
  const date = new Date(value);
  const parts = new Intl.DateTimeFormat("sv-SE", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value;
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}
export function berlinInstant(value: string) {
  if (/Z$|[+-]\d{2}:\d{2}$/.test(value)) return new Date(value).toISOString();
  const expected = Date.parse(value + "Z");
  if (!Number.isFinite(expected)) throw new Error("Ungültiges Datum.");
  let result = expected;
  for (let i = 0; i < 3; i++) {
    const local = Date.parse(berlinInput(new Date(result).toISOString()) + "Z");
    result += expected - local;
  }
  const iso = new Date(result).toISOString();
  if (berlinInput(iso) !== value.slice(0, 16))
    throw new Error(
      "Diese Uhrzeit existiert aufgrund der Zeitumstellung nicht.",
    );
  return iso;
}
