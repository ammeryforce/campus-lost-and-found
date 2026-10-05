"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Icon } from "@/components/icons";
import { EmptyState, FormActions, Modal, Notice, SearchField, StatusBadge } from "@/components/ui";
import { apiRequest } from "@/lib/api-client";
import { CLAIM_STATUSES, type Claim, type Item, type User } from "@/lib/types";
import type { AuthUser } from "@/lib/auth";

export function ClaimManager({ user }: { user: AuthUser }) {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [editing, setEditing] = useState<Claim | null>(null);
  const [preferredItem, setPreferredItem] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [success, setSuccess] = useState("");

  const loadData = useCallback(async () => {
    try {
      const claimData = await apiRequest<Claim[]>("/api/claims");
      const itemData = await apiRequest<Item[]>("/api/items");
      const userData = await apiRequest<User[]>("/api/users");

      setClaims(claimData);
      setItems(itemData);
      setUsers(userData);
      setError("");
    } catch (requestError) {
      setError((requestError as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadData();
      const params = new URLSearchParams(window.location.search);
      if (params.has("new")) { setPreferredItem(params.get("item") || ""); setFormOpen(true); }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadData]);

  function findUser(userId: string) {
    return users.find((user) => user.id === userId);
  }

  function findItem(itemId: string) {
    return items.find((item) => item.id === itemId);
  }

  const filtered = claims.filter((claim) => {
    const claimantName = findUser(claim.claimantId)?.name || "";
    const itemName = findItem(claim.itemId)?.name || "";
    const words = `${claimantName} ${itemName} ${claim.description}`.toLowerCase();
    const matchesSearch = words.includes(search.toLowerCase());
    const matchesStatus = status === "all" || claim.status === status;

    return matchesSearch && matchesStatus;
  });
  const ready = users.length > 0 && items.some((item) => item.status !== "returned");

  function openCreate() {
    setEditing(null);
    setPreferredItem("");
    setFormError("");
    setFormOpen(true);
  }

  function openEdit(claim: Claim) {
    setEditing(claim);
    setFormError("");
    setFormOpen(true);
  }

  function closeForm() {
    if (!busy) {
      setFormOpen(false);
    }
  }

  async function saveClaim(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setFormError("");

    const formData = new FormData(event.currentTarget);
    const body = Object.fromEntries(formData);
    const url = editing ? `/api/claims/${editing.id}` : "/api/claims";
    const method = editing ? "PATCH" : "POST";

    try {
      await apiRequest<Claim>(url, {
        method,
        body: JSON.stringify(body),
      });

      setFormOpen(false);
      setSuccess(editing ? "Claim details updated." : "Claim submitted for review.");
      await loadData();
    } catch (requestError) {
      setFormError((requestError as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function updateStatus(claim: Claim, nextStatus: "approved" | "rejected") {
    const message =
      nextStatus === "approved"
        ? "Approving this claim will mark the item as returned. Continue?"
        : "Reject this claim?";

    if (!window.confirm(message)) return;

    try {
      await apiRequest<Claim>(`/api/claims/${claim.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: nextStatus }),
      });

      setSuccess(`Claim ${nextStatus}.`);
      await loadData();
    } catch (requestError) {
      setError((requestError as Error).message);
    }
  }

  async function deleteClaim(claim: Claim) {
    if (!window.confirm("Delete this claim record? This cannot be undone.")) return;

    try {
      await apiRequest(`/api/claims/${claim.id}`, { method: "DELETE" });
      setSuccess("Claim deleted.");
      await loadData();
    } catch (requestError) {
      setError((requestError as Error).message);
    }
  }

  return (
    <main className="page-shell resource-page">
      <div className="page-heading">
        <div><p className="eyebrow">Ownership review</p><h1>Claims</h1><p>Review identifying details, approve the rightful owner, and keep a clear resolution history.</p></div>
        <button className="button button-primary" onClick={openCreate} disabled={!ready}><Icon name="plus" /> New claim</button>
      </div>
      {error && <Notice message={error} />}{success && <Notice message={success} tone="success" />}
      {!ready && !loading && !error && <Notice message="A claim needs at least one person and one open item report." />}

      <section className="toolbar panel compact-toolbar">
        <SearchField value={search} onChange={setSearch} placeholder="Search by claimant, item, or details…" />
        <label className="filter-field"><span>Status</span><select value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">All statuses</option>{CLAIM_STATUSES.map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
        <span className="result-count">{filtered.length} {filtered.length === 1 ? "claim" : "claims"}</span>
      </section>

      {loading ? <div className="loading-card">Loading claims…</div> : filtered.length ? (
        <section className="claim-list">
          {filtered.map((claim) => {
            const claimant = findUser(claim.claimantId);
            const item = findItem(claim.itemId);
            return (
              <article className="claim-card" key={claim.id}>
                <div className="claim-person"><span className="person-avatar">{(claimant?.name || "U").split(/\s+/).slice(0, 2).map((part) => part[0]).join("")}</span><div><small>Claim submitted by</small><h2>{claimant?.name || "Unknown person"}</h2><span>{claimant?.email || "Profile unavailable"}</span></div></div>
                <div className="claim-item">
                  {item?.imageUrl && (
                    <div
                      className="claim-item-photo"
                      role="img"
                      aria-label={`Photo of ${item.name}`}
                      style={{
                        backgroundImage: `url("${item.imageUrl.replace(/["\\]/g, "")}")`,
                      }}
                    />
                  )}
                  <small>Item requested</small>
                  <strong>{item?.name || "Unknown item"}</strong>
                  <span><Icon name="pin" /> {item?.location || "Unknown location"}</span>
                </div>
                <blockquote>“{claim.description}”</blockquote>
                <div className="claim-state"><StatusBadge status={claim.status} /><small><Icon name="clock" /> {new Date(claim.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</small></div>
                <div className="claim-actions">
                  {user.role === "admin" && claim.status === "pending" && <><button className="button button-approve" onClick={() => void updateStatus(claim, "approved")}><Icon name="check" /> Approve</button><button className="button button-reject" onClick={() => void updateStatus(claim, "rejected")}><Icon name="close" /> Reject</button></>}
                  <button className="icon-button" onClick={() => openEdit(claim)} aria-label="Edit claim"><Icon name="edit" /></button><button className="icon-button danger" onClick={() => void deleteClaim(claim)} aria-label="Delete claim"><Icon name="trash" /></button>
                </div>
              </article>
            );
          })}
        </section>
      ) : <EmptyState icon="claim" title="No claims in this view" message="The queue is clear, or your search did not match a claim." action={ready ? <button className="button button-primary" onClick={openCreate}><Icon name="plus" /> New claim</button> : undefined} />}

      {formOpen && (
        <Modal title={editing ? "Edit claim details" : "Submit a claim"} description="Use identifying details that are not visible in the public item report." onClose={closeForm}>
          {editing || ready ? (
            <form className="resource-form" onSubmit={saveClaim}>
              {formError && <Notice message={formError} />}
              {!editing && <>
                <label><span>Item</span><select name="itemId" required defaultValue={preferredItem || ""}><option value="" disabled>Choose an open item</option>{items.filter((item) => item.status !== "returned").map((item) => <option key={item.id} value={item.id}>{item.name} · {item.location}</option>)}</select></label>
                <label><span>Claimant</span><select name="claimantId" required defaultValue={user.id}>{(user.role === "admin" ? users : users.filter((person) => person.id === user.id)).map((person) => <option key={person.id} value={person.id}>{person.name} · {person.email}</option>)}</select></label>
              </>}
              <label><span>Proof of ownership</span><textarea name="description" required minLength={10} maxLength={1000} rows={5} defaultValue={editing?.description} placeholder="Describe a hidden mark, contents, lock-screen image, serial number, or another detail…" /><small>Do not copy details already shown in the item report.</small></label>
              <FormActions busy={busy} onCancel={closeForm} submitLabel={editing ? "Save details" : "Submit claim"} />
            </form>
          ) : <div className="modal-empty"><p>Add a person and an open item report before creating a claim.</p><div><Link className="button button-secondary" href="/users?new=1">Add person</Link><Link className="button button-primary" href="/items?new=1">Report item</Link></div></div>}
        </Modal>
      )}
    </main>
  );
}
