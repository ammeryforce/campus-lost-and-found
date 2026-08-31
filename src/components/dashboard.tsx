"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Icon, type IconName } from "@/components/icons";
import { Notice, StatusBadge } from "@/components/ui";
import { apiRequest } from "@/lib/api-client";
import type { Claim, Item, User } from "@/lib/types";

const categoryIcons: Record<string, string> = { Electronics: "⌁", "Books & Notes": "Aa", Clothing: "◇", Keys: "⌘", "Cards & IDs": "▣", Bags: "⌂", Other: "?" };

function StatCard({ icon, value, label, note, tone }: { icon: IconName; value: number; label: string; note: string; tone: string }) {
  return <article className="stat-card"><span className={`stat-icon ${tone}`}><Icon name={icon} /></span><div><strong>{value}</strong><span>{label}</span><small>{note}</small></div></article>;
}

export function Dashboard() {
  const [items, setItems] = useState<Item[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const itemData = await apiRequest<Item[]>("/api/items");
        const claimData = await apiRequest<Claim[]>("/api/claims");
        const userData = await apiRequest<User[]>("/api/users");

        setItems(itemData);
        setClaims(claimData);
        setUsers(userData);
      } catch (requestError) {
        setError((requestError as Error).message);
      } finally {
        setLoading(false);
      }
    }

    void loadDashboard();
  }, []);

  function getUserName(userId: string) {
    return users.find((user) => user.id === userId)?.name || "Unknown user";
  }

  function getItemName(itemId: string) {
    return items.find((item) => item.id === itemId)?.name || "Unknown item";
  }
  const returned = items.filter((item) => item.status === "returned").length;
  const openItems = items.filter((item) => item.status !== "returned").length;
  const pendingClaims = claims.filter((claim) => claim.status === "pending").length;

  return (
    <main className="page-shell dashboard-page">
      <section className="hero-grid">
        <div className="hero-copy">
          <p className="eyebrow">Campus operations</p>
          <h1>Every item has a way <span>back home.</span></h1>
          <p>Keep lost-property reports organized, connect items with their owners, and resolve claims from one calm workspace.</p>
          <div className="hero-actions">
            <Link className="button button-primary" href="/items?new=1"><Icon name="plus" /> Report an item</Link>
            <Link className="button button-secondary" href="/items">Browse reports <Icon name="arrow" /></Link>
          </div>
        </div>
        <div className="hero-art" aria-hidden="true">
          <span className="orbit orbit-one" /><span className="orbit orbit-two" />
          <div className="art-pin"><Icon name="pin" /></div>
          <div className="art-card art-card-one"><span>Found</span><strong>Campus keys</strong><small>Library · 10:42</small></div>
          <div className="art-card art-card-two"><span>Matched</span><strong>Owner located</strong><small>Ready for pickup</small></div>
        </div>
      </section>

      {error && <Notice message={`${error} The interface is ready; add your database settings to load live records.`} />}

      <section className="stats-grid" aria-label="System summary">
        <StatCard icon="box" value={openItems} label="Open reports" note="Still being resolved" tone="indigo" />
        <StatCard icon="claim" value={pendingClaims} label="Pending claims" note="Waiting for review" tone="amber" />
        <StatCard icon="check" value={returned} label="Items returned" note="Successful matches" tone="green" />
        <StatCard icon="users" value={users.length} label="People registered" note="Students and staff" tone="blue" />
      </section>

      <section className="dashboard-grid">
        <div className="panel">
          <div className="section-heading"><div><p className="eyebrow">Latest activity</p><h2>Recent reports</h2></div><Link href="/items">View all <Icon name="arrow" /></Link></div>
          <div className="recent-list">
            {loading ? <p className="muted">Loading reports…</p> : items.slice(0, 4).map((item) => (
              <article className="recent-item" key={item.id}>
                <span className={`category-tile category-${item.status}`}>{categoryIcons[item.category]}</span>
                <div className="recent-main"><strong>{item.name}</strong><span><Icon name="pin" /> {item.location}</span></div>
                <div className="recent-meta"><StatusBadge status={item.status} /><small>{new Date(item.occurredAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</small></div>
              </article>
            ))}
            {!loading && !error && items.length === 0 && <p className="muted">No reports yet. Create the first one.</p>}
          </div>
        </div>

        <div className="panel claim-preview">
          <div className="section-heading"><div><p className="eyebrow">Needs attention</p><h2>Claim queue</h2></div><Link href="/claims">Manage</Link></div>
          <div className="claim-mini-list">
            {claims.slice(0, 4).map((claim) => (
              <article key={claim.id}><span className="mini-avatar">{getUserName(claim.claimantId).slice(0, 1)}</span><div><strong>{getUserName(claim.claimantId)}</strong><small>{getItemName(claim.itemId)}</small></div><StatusBadge status={claim.status} /></article>
            ))}
            {!loading && claims.length === 0 && <p className="muted">The claim queue is clear.</p>}
          </div>
          <Link href="/claims?new=1" className="button button-soft"><Icon name="plus" /> Create a claim</Link>
        </div>
      </section>
      <footer className="page-footer"><span>Findly campus desk</span><span>Built for quicker reunions.</span></footer>
    </main>
  );
}
