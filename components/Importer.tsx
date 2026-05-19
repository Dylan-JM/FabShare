"use client";

import { useState } from "react";
import { encode } from "@/lib/codec";
import { parseAssets } from "@/lib/parser";
import type { FabAsset } from "@/lib/types";
import CopyButton from "./CopyButton";

// Single script — no refresh needed.
// Uses the Performance API to find the endpoint Fab already called when the
// page loaded, then paginates through it directly using the active session.
const SCRAPER = `(async () => {
  // Find the endpoint Fab already used to load this page
  const urls = performance.getEntriesByType('resource')
    .map(r => r.name)
    .filter(u => u.includes('www.fab.com') && u.includes('limit='));

  const raw = urls.find(u => /\\/i\\/.+limit=/.test(u)) || urls[0];

  if (!raw) {
    console.error('❌ Could not detect the API endpoint. Make sure you are on fab.com/library and the page has fully loaded.');
    return;
  }

  const base = new URL(raw);
  base.searchParams.set('limit', '48');
  base.searchParams.set('offset', '0');

  const all = [];
  let next = base.toString();

  while (next) {
    const r = await fetch(next, { credentials: 'include' });
    if (!r.ok) { console.error('Request failed:', r.status, next); break; }
    const j = await r.json();
    if (!j.results?.length) break;
    all.push(...j.results);
    next = j.next || null;
    console.log(\`📦 \${all.length} assets loaded...\`);
  }

  if (!all.length) {
    console.error('❌ No assets returned. Are you logged in and on fab.com/library?');
    return;
  }

  const assets = all.map(item => ({
    name: item.title,
    category: item.categories?.[0]?.name ?? 'Uncategorized',
    thumbnail: item.thumbnail_url ?? '',
    url: \`https://www.fab.com/listings/\${item.uid}\`,
    price: item.price_range ?? 'Free',
  }));

  copy(JSON.stringify(assets));
  console.log(\`✅ Copied \${assets.length} assets! Paste into FabShare.\`);
})();`;

const DEMO: FabAsset[] = [
  { name: "Modular Dungeon Pack", category: "Environments", thumbnail: "", url: "https://www.fab.com", price: "$49.99" },
  { name: "Fantasy Character Bundle", category: "Characters", thumbnail: "", url: "https://www.fab.com", price: "Free" },
  { name: "Sci-Fi Corridor Kit", category: "Environments", thumbnail: "", url: "https://www.fab.com", price: "$39.99" },
  { name: "Magic Spell Effects Vol.3", category: "VFX", thumbnail: "", url: "https://www.fab.com", price: "$34.99" },
  { name: "Creature Animations 200+", category: "Animations", thumbnail: "", url: "https://www.fab.com", price: "$79.00" },
  { name: "Advanced Footstep System", category: "Blueprints", thumbnail: "", url: "https://www.fab.com", price: "Free" },
];

interface ImporterProps {
  onImport: (assets: FabAsset[]) => void;
}

export default function Importer({ onImport }: ImporterProps) {
  const [json, setJson] = useState("");
  const [error, setError] = useState("");

  const handleImport = (raw: string) => {
    setError("");
    try {
      const assets = parseAssets(raw);
      const hash = encode(assets);
      window.location.hash = hash;
      onImport(assets);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Invalid data.");
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0c" }}>
      {/* Header */}
      <header style={{
        position: "sticky", top: 0, zIndex: 100,
        background: "#0a0a0cee", backdropFilter: "blur(16px)",
        borderBottom: "1px solid #ffffff0f",
        padding: "0 32px", display: "flex", alignItems: "center", gap: 16, height: 64,
      }}>
        <span style={{ fontFamily: "var(--font-display)", fontSize: 26, letterSpacing: ".08em", color: "#e8622a" }}>
          Fab<span style={{ color: "#e8e8ee" }}>Share</span>
        </span>
      </header>

      {/* Body */}
      <div style={{ maxWidth: 680, margin: "48px auto", padding: "0 24px", textAlign: "center" }}>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: 36, letterSpacing: ".06em", marginBottom: 12 }}>
          Share Your Fab Library
        </h2>
        <p style={{ color: "#6b6b80", fontSize: 14, lineHeight: 1.7, marginBottom: 32 }}>
          Run one script on <strong style={{ color: "#e8e8ee" }}>fab.com/library</strong>, paste the output,
          and get a shareable URL — no backend, no accounts, just a link.
        </p>

        {/* Step 1 */}
        <Step n={1} title='Go to fab.com/library, open DevTools (F12 → Console), paste and run this'>
          <CodeBlock code={SCRAPER} />
          <p style={{ fontSize: 12, color: "#6b6b80", marginTop: 10 }}>
            The script finds Fab&apos;s API automatically and paginates through your full library.
            Watch the console — it logs progress and copies the result to your clipboard when done.
            <strong style={{ color: "#e8e8ee" }}> No refresh needed.</strong>
          </p>
        </Step>

        {/* Step 2 */}
        <Step n={2} title="Paste the copied JSON here and generate your link">
          <textarea
            value={json}
            onChange={e => setJson(e.target.value)}
            placeholder="Paste JSON here…"
            rows={7}
            style={{
              width: "100%", background: "#18181f", border: "1px solid #ffffff0f",
              borderRadius: 10, color: "#e8e8ee", fontFamily: "Courier New, monospace",
              fontSize: 12, padding: 12, resize: "vertical", outline: "none",
              transition: "border-color .2s",
            }}
            onFocus={e => (e.target.style.borderColor = "#e8622a")}
            onBlur={e => (e.target.style.borderColor = "#ffffff0f")}
          />
          {error && (
            <p style={{ color: "#e8622a", fontSize: 13, marginTop: 8, textAlign: "left" }}>{error}</p>
          )}
          <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 16, flexWrap: "wrap" }}>
            <button
              onClick={() => handleImport(json)}
              disabled={!json.trim()}
              style={{
                background: "#e8622a", color: "#fff", border: "none",
                padding: "10px 24px", borderRadius: 8, fontFamily: "inherit",
                fontSize: 14, fontWeight: 500, cursor: json.trim() ? "pointer" : "not-allowed",
                opacity: json.trim() ? 1 : 0.4, transition: "opacity .2s",
              }}
            >
              Generate Shareable Link →
            </button>
            <button
              onClick={() => onImport(DEMO)}
              style={{
                background: "transparent", border: "1px solid #ffffff0f", color: "#6b6b80",
                padding: "10px 24px", borderRadius: 8, fontFamily: "inherit",
                fontSize: 14, cursor: "pointer", transition: "all .15s",
              }}
              onMouseEnter={e => { (e.target as HTMLButtonElement).style.borderColor = "#e8622a"; (e.target as HTMLButtonElement).style.color = "#e8622a"; }}
              onMouseLeave={e => { (e.target as HTMLButtonElement).style.borderColor = "#ffffff0f"; (e.target as HTMLButtonElement).style.color = "#6b6b80"; }}
            >
              Load Demo
            </button>
          </div>
        </Step>
      </div>
    </div>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 32, textAlign: "left" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <span style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          width: 28, height: 28, borderRadius: "50%", background: "#e8622a",
          color: "#fff", fontSize: 13, fontWeight: 700, flexShrink: 0,
        }}>{n}</span>
        <span style={{ fontSize: 14, fontWeight: 500, color: "#e8e8ee" }}>{title}</span>
      </div>
      {children}
    </div>
  );
}

function CodeBlock({ code }: { code: string }) {
  return (
    <div style={{ borderRadius: 10, border: "1px solid #ffffff0f", overflow: "hidden" }}>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "8px 14px", background: "#18181f", borderBottom: "1px solid #ffffff0f",
      }}>
        <span style={{ fontSize: 11, color: "#6b6b80" }}>DevTools Console</span>
        <CopyButton text={code} />
      </div>
      <pre style={{
        margin: 0, padding: "12px 14px", background: "#111116",
        fontSize: 11, color: "#e8e8ee", overflowX: "auto", lineHeight: 1.6,
        fontFamily: "Courier New, monospace", whiteSpace: "pre",
      }}>{code}</pre>
    </div>
  );
}
