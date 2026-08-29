"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Icon } from "@/components/icons";
import { EmptyState, FormActions, Modal, Notice, SearchField } from "@/components/ui";
import { apiRequest } from "@/lib/api-client";
import { USER_ROLES, type User } from "@/lib/types";

function initials(name: string) {
  return name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

export function UserManager() {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("all");
  const [editing, setEditing] = useState<User | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [success, setSuccess] = useState("");

  const loadUsers = useCallback(async () => {
    try { setUsers(await apiRequest<User[]>("/api/users")); setError(""); }
    catch (requestError) { setError((requestError as Error).message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadUsers();
      if (new URLSearchParams(window.location.search).has("new")) setFormOpen(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadUsers]);

  const filtered = users.filter((user) => `${user.name} ${user.email}`.toLowerCase().includes(search.toLowerCase()) && (role === "all" || user.role === role));
  function openCreate() { setEditing(null); setFormError(""); setFormOpen(true); }
  function openEdit(user: User) { setEditing(user); setFormError(""); setFormOpen(true); }
  function closeForm() { if (!busy) setFormOpen(false); }

  async function saveUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setFormError("");
    const body = Object.fromEntries(new FormData(event.currentTarget));
    try {
      await apiRequest<User>(editing ? `/api/users/${editing.id}` : "/api/users", { method: editing ? "PATCH" : "POST", body: JSON.stringify(body) });
      setFormOpen(false); setSuccess(editing ? "Person updated." : "Person added."); await loadUsers();
    } catch (requestError) { setFormError((requestError as Error).message); }
    finally { setBusy(false); }
  }

  async function deleteUser(user: User) {
    if (!window.confirm(`Delete ${user.name}? This only works if the person has no item reports or claims.`)) return;
    try { await apiRequest(`/api/users/${user.id}`, { method: "DELETE" }); setSuccess("Person deleted."); await loadUsers(); }
    catch (requestError) { setError((requestError as Error).message); }
  }

  return (
    <main className="page-shell resource-page">
      <div className="page-heading">
        <div><p className="eyebrow">Campus directory</p><h1>People</h1><p>Manage the students, staff, and administrators who report items and submit claims.</p></div>
        <button className="button button-primary" onClick={openCreate}><Icon name="plus" /> Add a person</button>
      </div>
      {error && <Notice message={error} />}{success && <Notice message={success} tone="success" />}

      <section className="toolbar panel compact-toolbar">
        <SearchField value={search} onChange={setSearch} placeholder="Search by name or email…" />
        <label className="filter-field"><span>Role</span><select value={role} onChange={(event) => setRole(event.target.value)}><option value="all">All roles</option>{USER_ROLES.map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
        <span className="result-count">{filtered.length} {filtered.length === 1 ? "person" : "people"}</span>
      </section>

      {loading ? <div className="loading-card">Loading people…</div> : filtered.length ? (
        <section className="table-panel">
          <div className="data-table user-table table-header"><span>Person</span><span>Role</span><span>Joined</span><span>Actions</span></div>
          {filtered.map((user) => (
            <article className="data-table user-table" key={user.id}>
              <div className="person-cell"><span className="person-avatar">{initials(user.name)}</span><span><strong>{user.name}</strong><small>{user.email}</small></span></div>
              <div><span className={`role-chip role-${user.role}`}>{user.role}</span></div>
              <div className="date-cell"><Icon name="calendar" /> {new Date(user.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</div>
              <div className="row-actions"><button className="button button-tiny" onClick={() => openEdit(user)}><Icon name="edit" /> Edit</button><button className="icon-button danger" onClick={() => void deleteUser(user)} aria-label={`Delete ${user.name}`}><Icon name="trash" /></button></div>
            </article>
          ))}
        </section>
      ) : <EmptyState icon="users" title="No people found" message="Adjust your filters or register the first campus user." action={<button className="button button-primary" onClick={openCreate}><Icon name="plus" /> Add a person</button>} />}

      {formOpen && (
        <Modal title={editing ? "Edit person" : "Add a person"} description="This creates the profile used for reporting and claiming items." onClose={closeForm}>
          <form className="resource-form" onSubmit={saveUser}>
            {formError && <Notice message={formError} />}
            <label><span>Full name</span><input name="name" required minLength={2} maxLength={80} defaultValue={editing?.name} placeholder="e.g. Maya Chen" autoFocus /></label>
            <label><span>Campus email</span><input name="email" type="email" required defaultValue={editing?.email} placeholder="maya@university.edu" /></label>
            <label><span>Role</span><select name="role" defaultValue={editing?.role || "student"}>{USER_ROLES.map((value) => <option key={value} value={value}>{value[0].toUpperCase() + value.slice(1)}</option>)}</select><small>Administrators can be identified separately in reports and reviews.</small></label>
            <FormActions busy={busy} onCancel={closeForm} submitLabel={editing ? "Save changes" : "Add person"} />
          </form>
        </Modal>
      )}
    </main>
  );
}
