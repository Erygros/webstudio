"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { crmFetch } from "./api";
import { Modal } from "./modal";
export function WorkPrompt() {
  const started = useRef(false);
  const [show, setShow] = useState(false);
  const router = useRouter();
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void crmFetch<{ show: boolean }>("work/prompt", {
      method: "POST",
      body: "{}",
    })
      .then((data) => setShow(data.show))
      .catch(() => {});
  }, []);
  function choose(work: boolean) {
    setShow(false);
    router.push(work ? "/crm/arbeit" : "/crm");
  }
  return show ? (
    <Modal title="Möchtest du jetzt arbeiten?" onClose={() => choose(false)}>
      <p>
        Deinen aktuellen Vorgang fortsetzen oder mit dem nächsten Lead beginnen.
      </p>
      <div className="crm-actions">
        <button className="button" onClick={() => choose(true)}>
          Arbeiten
        </button>
        <button className="button secondary" onClick={() => choose(false)}>
          Abbrechen
        </button>
      </div>
    </Modal>
  ) : null;
}
