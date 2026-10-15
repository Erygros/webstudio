export const MAX_BODY = 3_500_000;
export const MAX_FILES = 3;
export const MAX_FILE_SIZE = 2_000_000;
export const MAX_TOTAL_SIZE = 3_000_000;
export async function readForm(request: Request, limit = MAX_BODY) {
  const size = request.headers.get("content-length");
  if (size && Number(size) > limit)
    throw new Error(
      "Die Anfrage ist zu groß. Anhänge dürfen zusammen maximal 3 MB enthalten.",
    );
  if (!request.body) throw new Error("Die Anfrage enthält keine Daten.");
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > limit) {
        await reader.cancel();
        throw new Error("Die Anfrage ist zu groß. Anhänge bitte verkleinern.");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  return new Response(Buffer.concat(chunks), {
    headers: { "Content-Type": request.headers.get("content-type") || "" },
  }).formData();
}
export async function validateAttachments(entries: FormDataEntryValue[]) {
  const files = entries.filter(
    (entry): entry is File => typeof entry !== "string" && entry.size > 0,
  );
  if (
    files.length > MAX_FILES ||
    files.reduce((n, f) => n + f.size, 0) > MAX_TOTAL_SIZE
  )
    throw new Error("Maximal 3 Dateien mit insgesamt 3 MB sind erlaubt.");
  const attachments: {
    filename: string;
    content: Buffer;
    contentType: string;
    contentDisposition: "attachment";
  }[] = [];
  for (const file of files) {
    if (file.size > MAX_FILE_SIZE)
      throw new Error("Eine einzelne Datei darf maximal 2 MB groß sein.");
    const content = Buffer.from(await file.arrayBuffer());
    const ext = file.name.split(".").at(-1)?.toLowerCase();
    const png = content
      .subarray(0, 8)
      .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    const jpeg =
      content[0] === 0xff && content[1] === 0xd8 && content[2] === 0xff;
    const pdf =
      content.subarray(0, 5).toString() === "%PDF-" &&
      !/\/(JavaScript|JS|Launch|EmbeddedFile|OpenAction|AA)\b/i.test(
        content.toString("latin1"),
      );
    let text = false;
    if (ext === "txt" && !content.includes(0)) {
      try {
        new TextDecoder("utf-8", { fatal: true }).decode(content);
        text = true;
      } catch {}
    }
    const valid =
      (ext === "png" && file.type === "image/png" && png) ||
      (["jpg", "jpeg"].includes(ext || "") &&
        file.type === "image/jpeg" &&
        jpeg) ||
      (ext === "pdf" && file.type === "application/pdf" && pdf) ||
      (ext === "txt" && ["text/plain", ""].includes(file.type) && text);
    if (!valid)
      throw new Error(
        "Erlaubt sind PDF ohne aktive Inhalte, PNG, JPG und UTF-8-TXT. Dateiendung und Inhalt müssen übereinstimmen.",
      );
    const filename =
      file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-100) || `anhang.${ext}`;
    attachments.push({
      filename,
      content,
      contentType: file.type || "text/plain",
      contentDisposition: "attachment",
    });
  }
  return attachments;
}
