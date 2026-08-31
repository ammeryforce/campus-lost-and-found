"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Icon } from "@/components/icons";
import { EmptyState, FormActions, Modal, Notice, SearchField, StatusBadge } from "@/components/ui";
import { apiRequest } from "@/lib/api-client";
import { ITEM_CATEGORIES, ITEM_STATUSES, type Item, type User } from "@/lib/types";

const categoryMarks: Record<string, string> = { Electronics: "⌁", "Books & Notes": "Aa", Clothing: "◇", Keys: "⌘", "Cards & IDs": "▣", Bags: "⌂", Other: "?" };

function ItemForm({ item, users, busy, error, onClose, onSaved }: { item: Item | null; users: User[]; busy: boolean; error: string; onClose: () => void; onSaved: (event: FormEvent<HTMLFormElement>) => void }) {
  return (
    <form className="resource-form" onSubmit={onSaved}>
      {error && <Notice message={error} />}
      <div className="form-grid two-columns">
        <label><span>Item name</span><input name="name" required minLength={2} maxLength={100} defaultValue={item?.name} placeholder="e.g. Black water bottle" /></label>
        <label><span>Category</span><select name="category" required defaultValue={item?.category || "Electronics"}>{ITEM_CATEGORIES.map((category) => <option key={category}>{category}</option>)}</select></label>
      </div>
      <label><span>Description</span><textarea name="description" required minLength={10} maxLength={1000} rows={4} defaultValue={item?.description} placeholder="Color, brand, unique marks, and anything that may help identify it…" /></label>
      <div className="form-grid two-columns">
        <label><span>Location</span><input name="location" required defaultValue={item?.location} placeholder="e.g. Main Library, Floor 2" /></label>
        <label><span>Date lost or found</span><input name="occurredAt" type="date" required defaultValue={item ? item.occurredAt.slice(0, 10) : new Date().toISOString().slice(0, 10)} /></label>
      </div>
      <div className="form-grid two-columns">
        <label><span>Status</span><select name="status" defaultValue={item?.status || "found"}>{ITEM_STATUSES.map((status) => <option key={status} value={status}>{status[0].toUpperCase() + status.slice(1)}</option>)}</select></label>
        <label><span>Reported by</span><select name="reporterId" required defaultValue={item?.reporterId || users[0]?.id || ""}><option value="" disabled>Choose a person</option>{users.map((user) => <option key={user.id} value={user.id}>{user.name} · {user.role}</option>)}</select></label>
      </div>
      <label><span>Image URL <em>optional</em></span><input name="imageUrl" type="url" defaultValue={item?.imageUrl} placeholder="https://example.com/item-photo.jpg" /></label>
      <FormActions busy={busy} onCancel={onClose} submitLabel={item ? "Save changes" : "Create report"} />
    </form>
  );
}

export function ItemManager() {
  const [items, setItems] = useState<Item[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [category, setCategory] = useState("all");
  const [editing, setEditing] = useState<Item | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [success, setSuccess] = useState("");

  const loadData = useCallback(async () => {
    try {
      const itemData = await apiRequest<Item[]>("/api/items");
      const userData = await apiRequest<User[]>("/api/users");

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
      if (new URLSearchParams(window.location.search).has("new")) setFormOpen(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadData]);

  function getReporterName(reporterId: string) {
    const reporter = users.find((user) => user.id === reporterId);
    return reporter?.name || "Unknown user";
  }

  const filteredItems = items.filter((item) => {
    const phrase = `${item.name} ${item.description} ${item.location}`.toLowerCase();
    const matchesSearch = phrase.includes(search.toLowerCase());
    const matchesStatus = status === "all" || item.status === status;
    const matchesCategory = category === "all" || item.category === category;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  function openCreate() {
    setEditing(null);
    setFormError("");
    setFormOpen(true);
  }

  function openEdit(item: Item) {
    setEditing(item);
    setFormError("");
    setFormOpen(true);
  }

  function closeForm() {
    if (!busy) {
      setFormOpen(false);
    }
  }

  async function saveItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setFormError("");

    const formData = new FormData(event.currentTarget);
    const body = Object.fromEntries(formData);
    const url = editing ? `/api/items/${editing.id}` : "/api/items";
    const method = editing ? "PATCH" : "POST";

    try {
      await apiRequest<Item>(url, {
        method,
        body: JSON.stringify(body),
      });

      setFormOpen(false);
      setSuccess(editing ? "Item report updated." : "Item report created.");
      await loadData();
    } catch (requestError) {
      setFormError((requestError as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function deleteItem(item: Item) {
    const confirmed = window.confirm(
      `Delete the report for “${item.name}”? It will disappear from active reports.`,
    );

    if (!confirmed) return;

    try {
      await apiRequest<{ deleted: boolean }>(`/api/items/${item.id}`, { method: "DELETE" });
      setSuccess("Item report deleted and hidden from active reports.");
      await loadData();
    } catch (requestError) {
      setError((requestError as Error).message);
    }
  }

  return (
    <main className="page-shell resource-page">
      <div className="page-heading">
        <div><p className="eyebrow">Lost property registry</p><h1>Item reports</h1><p>Search every open report, record a newly lost or found item, and keep its status current.</p></div>
        <button className="button button-primary" onClick={openCreate} disabled={users.length === 0}><Icon name="plus" /> Report an item</button>
      </div>
      {error && <Notice message={error} />}{success && <Notice message={success} tone="success" />}
      {users.length === 0 && !loading && !error && <Notice message="Add at least one person before reporting an item." />}

      <section className="toolbar panel">
        <SearchField value={search} onChange={setSearch} placeholder="Search by item, description, or location…" />
        <label className="filter-field"><span>Status</span><select value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">All statuses</option>{ITEM_STATUSES.map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
        <label className="filter-field"><span>Category</span><select value={category} onChange={(event) => setCategory(event.target.value)}><option value="all">All categories</option>{ITEM_CATEGORIES.map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
        <span className="result-count">{filteredItems.length} {filteredItems.length === 1 ? "report" : "reports"}</span>
      </section>

      {loading ? <div className="loading-card">Loading item reports…</div> : filteredItems.length ? (
        <section className="item-grid">
          {filteredItems.map((item) => (
            <article className="item-card" key={item.id}>
              <div className={`item-visual visual-${item.status}`} style={item.imageUrl ? { backgroundImage: `linear-gradient(135deg, rgb(29 27 75 / 45%), rgb(67 56 202 / 15%)), url("${item.imageUrl.replace(/["\\]/g, "")}")` } : undefined}>
                {!item.imageUrl && <span>{categoryMarks[item.category]}</span>}<StatusBadge status={item.status} />
              </div>
              <div className="item-card-body">
                <div className="item-card-title"><div><small>{item.category}</small><h2>{item.name}</h2></div><div className="card-actions"><button className="icon-button" onClick={() => openEdit(item)} aria-label={`Edit ${item.name}`}><Icon name="edit" /></button><button className="icon-button danger" onClick={() => void deleteItem(item)} aria-label={`Delete ${item.name}`}><Icon name="trash" /></button></div></div>
                <p>{item.description}</p>
                <div className="item-facts"><span><Icon name="pin" /> {item.location}</span><span><Icon name="calendar" /> {new Date(item.occurredAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</span></div>
                <div className="reported-by"><span className="mini-avatar">{getReporterName(item.reporterId)[0]}</span><span>Reported by <strong>{getReporterName(item.reporterId)}</strong></span><Link href={`/claims?item=${item.id}&new=1`}>Claim <Icon name="arrow" /></Link></div>
              </div>
            </article>
          ))}
        </section>
      ) : <EmptyState icon="box" title="No matching reports" message="Try a different search or add the first item report." action={<button className="button button-primary" onClick={openCreate}><Icon name="plus" /> New report</button>} />}

      {formOpen && <Modal title={editing ? "Edit item report" : "Report an item"} description="Accurate details make a safe reunion much more likely." onClose={closeForm}>{users.length ? <ItemForm item={editing} users={users} busy={busy} error={formError} onClose={closeForm} onSaved={saveItem} /> : <div className="modal-empty"><p>You need a registered person to act as the reporter.</p><Link className="button button-primary" href="/users?new=1">Add a person</Link></div>}</Modal>}
    </main>
  );
}
