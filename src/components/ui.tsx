"use client";

import type { ReactNode } from "react";
import { Icon } from "@/components/icons";

export function StatusBadge({ status }: { status: string }) {
  return <span className={`status-badge status-${status}`}>{status}</span>;
}

export function Modal({ title, description, children, onClose }: { title: string; description: string; children: ReactNode; onClose: () => void }) {
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="modal-card" role="dialog" aria-modal="true" aria-labelledby="modal-title" onMouseDown={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <div><p className="eyebrow">Campus registry</p><h2 id="modal-title">{title}</h2><p>{description}</p></div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Close"><Icon name="close" /></button>
        </div>
        {children}
      </section>
    </div>
  );
}

export function FormActions({ busy, onCancel, submitLabel }: { busy: boolean; onCancel: () => void; submitLabel: string }) {
  return (
    <div className="form-actions">
      <button className="button button-ghost" type="button" onClick={onCancel}>Cancel</button>
      <button className="button button-primary" type="submit" disabled={busy}>{busy ? "Saving…" : submitLabel}</button>
    </div>
  );
}

export function Notice({ message, tone = "error" }: { message: string; tone?: "error" | "success" }) {
  return <div className={`notice notice-${tone}`} role="status"><Icon name={tone === "success" ? "check" : "alert"} /><span>{message}</span></div>;
}

export function EmptyState({ icon, title, message, action }: { icon: "box" | "claim" | "users"; title: string; message: string; action?: ReactNode }) {
  return (
    <div className="empty-state">
      <span className="empty-icon"><Icon name={icon} /></span><h3>{title}</h3><p>{message}</p>{action}
    </div>
  );
}

export function SearchField({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder: string }) {
  return (
    <label className="search-field"><span className="sr-only">Search</span><Icon name="search" /><input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} /></label>
  );
}
