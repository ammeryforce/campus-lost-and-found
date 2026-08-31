"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Icon } from "@/components/icons";
import { EmptyState, FormActions, Modal, Notice, SearchField } from "@/components/ui";
import { apiRequest } from "@/lib/api-client";
import { USER_ROLES, type User } from "@/lib/types";

function getInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export function UserManager() {
  // Data shown on the page.
  const [users, setUsers] = useState<User[]>([]);

  // Search and filter values.
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("all");

  // Form state.
  const [formOpen, setFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Loading and message state.
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [success, setSuccess] = useState("");

  // GET /api/users
  const loadUsers = useCallback(async () => {
    try {
      const data = await apiRequest<User[]>("/api/users");
      setUsers(data);
      setError("");
    } catch (requestError) {
      setError((requestError as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load users when the page first opens.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadUsers();

      const query = new URLSearchParams(window.location.search);
      if (query.has("new")) {
        setFormOpen(true);
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadUsers]);

  const filteredUsers = users.filter((user) => {
    const matchesText = `${user.name} ${user.email}`
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchesRole = role === "all" || user.role === role;
    return matchesText && matchesRole;
  });

  function openCreateForm() {
    setEditingUser(null);
    setFormError("");
    setFormOpen(true);
  }

  function openEditForm(user: User) {
    setEditingUser(user);
    setFormError("");
    setFormOpen(true);
  }

  function closeForm() {
    if (!saving) {
      setFormOpen(false);
    }
  }

  // POST creates a user. PATCH updates an existing user.
  async function saveUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setFormError("");

    const formData = new FormData(event.currentTarget);
    const body = Object.fromEntries(formData);
    const url = editingUser ? `/api/users/${editingUser.id}` : "/api/users";
    const method = editingUser ? "PATCH" : "POST";

    try {
      await apiRequest<User>(url, {
        method,
        body: JSON.stringify(body),
      });

      setFormOpen(false);
      setSuccess(editingUser ? "Person updated." : "Person added.");
      await loadUsers();
    } catch (requestError) {
      setFormError((requestError as Error).message);
    } finally {
      setSaving(false);
    }
  }

  // DELETE /api/users/:id
  async function deleteUser(user: User) {
    const confirmed = window.confirm(
      `Delete ${user.name}? This only works if the person has no item reports or claims.`,
    );

    if (!confirmed) return;

    try {
      await apiRequest(`/api/users/${user.id}`, { method: "DELETE" });
      setSuccess("Person deleted.");
      await loadUsers();
    } catch (requestError) {
      setError((requestError as Error).message);
    }
  }

  return (
    <main className="page-shell resource-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Campus directory</p>
          <h1>People</h1>
          <p>Manage the students, staff, and administrators who use the system.</p>
        </div>
        <button className="button button-primary" onClick={openCreateForm}>
          <Icon name="plus" /> Add a person
        </button>
      </div>

      {error && <Notice message={error} />}
      {success && <Notice message={success} tone="success" />}

      <section className="toolbar panel compact-toolbar">
        <SearchField
          value={search}
          onChange={setSearch}
          placeholder="Search by name or email…"
        />

        <label className="filter-field">
          <span>Role</span>
          <select value={role} onChange={(event) => setRole(event.target.value)}>
            <option value="all">All roles</option>
            {USER_ROLES.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>

        <span className="result-count">
          {filteredUsers.length} {filteredUsers.length === 1 ? "person" : "people"}
        </span>
      </section>

      {loading && <div className="loading-card">Loading people…</div>}

      {!loading && filteredUsers.length > 0 && (
        <section className="table-panel">
          <div className="data-table user-table table-header">
            <span>Person</span>
            <span>Role</span>
            <span>Joined</span>
            <span>Actions</span>
          </div>

          {filteredUsers.map((user) => (
            <article className="data-table user-table" key={user.id}>
              <div className="person-cell">
                <span className="person-avatar">{getInitials(user.name)}</span>
                <span>
                  <strong>{user.name}</strong>
                  <small>{user.email}</small>
                </span>
              </div>

              <div>
                <span className={`role-chip role-${user.role}`}>{user.role}</span>
              </div>

              <div className="date-cell">
                <Icon name="calendar" /> {new Date(user.createdAt).toLocaleDateString()}
              </div>

              <div className="row-actions">
                <button className="button button-tiny" onClick={() => openEditForm(user)}>
                  <Icon name="edit" /> Edit
                </button>
                <button
                  className="icon-button danger"
                  onClick={() => void deleteUser(user)}
                  aria-label={`Delete ${user.name}`}
                >
                  <Icon name="trash" />
                </button>
              </div>
            </article>
          ))}
        </section>
      )}

      {!loading && filteredUsers.length === 0 && (
        <EmptyState
          icon="users"
          title="No people found"
          message="Adjust your filters or register the first campus user."
          action={
            <button className="button button-primary" onClick={openCreateForm}>
              <Icon name="plus" /> Add a person
            </button>
          }
        />
      )}

      {formOpen && (
        <Modal
          title={editingUser ? "Edit person" : "Add a person"}
          description="This profile is used for reporting and claiming items."
          onClose={closeForm}
        >
          <form className="resource-form" onSubmit={saveUser}>
            {formError && <Notice message={formError} />}

            <label>
              <span>Full name</span>
              <input
                name="name"
                required
                minLength={2}
                maxLength={80}
                defaultValue={editingUser?.name}
                placeholder="e.g. Maya Chen"
                autoFocus
              />
            </label>

            <label>
              <span>Campus email</span>
              <input
                name="email"
                type="email"
                required
                defaultValue={editingUser?.email}
                placeholder="maya@university.edu"
              />
            </label>

            <label>
              <span>Role</span>
              <select name="role" defaultValue={editingUser?.role || "student"}>
                {USER_ROLES.map((value) => (
                  <option key={value} value={value}>
                    {value[0].toUpperCase() + value.slice(1)}
                  </option>
                ))}
              </select>
            </label>

            <FormActions
              busy={saving}
              onCancel={closeForm}
              submitLabel={editingUser ? "Save changes" : "Add person"}
            />
          </form>
        </Modal>
      )}
    </main>
  );
}
