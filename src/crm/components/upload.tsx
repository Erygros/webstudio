"use client";
import { useRef, useState } from "react";
import { crmFetch } from "./api";
export function DocumentUpload({
  companyId,
  projectId,
  onSaved,
}: {
  companyId?: string;
  projectId?: string;
  onSaved: () => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function upload(file?: File) {
    if (!file) return;
    setError("");
    if (file.size > 2_000_000) {
      setError("Maximal 2 MB je Datei.");
      return;
    }
    setBusy(true);
    const body = new FormData();
    body.set("file", file);
    if (companyId) body.set("company_id", companyId);
    if (projectId) body.set("project_id", projectId);
    try {
      await crmFetch("documents", { method: "POST", body });
      onSaved();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
      if (ref.current) ref.current.value = "";
    }
  }
  return (
    <div>
      <input
        ref={ref}
        type="file"
        hidden
        accept=".pdf,.png,.jpg,.jpeg,.txt,.xml"
        onChange={(e) => void upload(e.target.files?.[0])}
      />
      <button
        className="button"
        disabled={busy}
        onClick={() => ref.current?.click()}
      >
        {busy ? "Wird hochgeladen …" : "+ Dokument hochladen"}
      </button>
      {error && <p role="alert">{error}</p>}
    </div>
  );
}
