"use client";
import { useEffect, useRef } from "react";
export function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    ref.current?.showModal();
    const el = ref.current;
    return () => el?.close();
  }, []);
  return (
    <dialog
      ref={ref}
      className="crm-modal"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
    >
      <div className="crm-modal-head">
        <h2>{title}</h2>
        <button
          className="crm-icon-button"
          onClick={onClose}
          aria-label="Fenster schließen"
        >
          ×
        </button>
      </div>
      {children}
    </dialog>
  );
}
