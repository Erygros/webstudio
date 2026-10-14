export async function crmFetch<T = Record<string, unknown>>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const response = await fetch(`/api/crm/${path}`, {
    cache: "no-store",
    ...options,
    headers: {
      ...(options?.body instanceof FormData
        ? {}
        : { "Content-Type": "application/json" }),
      ...options?.headers,
    },
  });
  const data = await response.json();
  if (!response.ok)
    throw new Error(
      data.error || "Die Aktion konnte nicht abgeschlossen werden.",
    );
  return data as T;
}
