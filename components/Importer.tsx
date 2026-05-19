"use client";

import { useState } from "react";
import { encode } from "@/lib/codec";
import { parseAssets } from "@/lib/parser";
import type { FabAsset } from "@/lib/types";
import CopyButton from "./CopyButton";

const SCRAPER = `(async function scrapeFabLibrary() {
  console.log("🔍 Starting Fab library scrape...");

  function fmtItem(item, uid) {
    const min = item.price_range?.min;
    return {
      name:      item.title || item.name || "Untitled",
      category:  item.categories?.[0]?.name || item.category?.name || item.category || "Uncategorized",
      thumbnail: item.thumbnail_url || item.cover_image || item.images?.[0]?.url || "",
      url:       \`https://www.fab.com/listings/\${uid || item.uid}\`,
      price:     min != null ? (min === 0 ? "Free" : \`$\${min}\`) : item.is_free ? "Free" : "Paid",
    };
  }

  const assets = [];

  // ── Strategy 1: __NEXT_DATA__ already in this page ───────
  try {
    const nd = window.__NEXT_DATA__;
    if (nd) {
      const walk = (o, d = 0) => {
        if (d > 8 || !o || typeof o !== "object") return null;
        if (Array.isArray(o) && o.length > 0 && o[0]?.uid) return o;
        for (const v of Object.values(o)) { const f = walk(v, d + 1); if (f) return f; }
        return null;
      };
      const listings = walk(nd.props?.pageProps);
      if (listings?.length) {
        listings.forEach(item => assets.push(fmtItem(item, item.uid)));
        console.log(\`✅ Found \${assets.length} assets in page data\`);
      }
    }
  } catch {}

  // ── Strategy 2: UIDs from DOM → fetch each listing page ──
  // The internal /i/listings/ API doesn't exist, but each public listing page
  // embeds its full data in __NEXT_DATA__ which we can parse from the HTML.
  if (!assets.length) {
    const seen = new Set();
    document.querySelectorAll("a[href*='/listings/']").forEach(a => {
      const m = a.href.match(/listings\\/([a-f0-9-]{36})/i);
      if (m && !seen.has(m[1])) seen.add(m[1]);
    });
    const uids = [...seen];

    if (!uids.length) {
      console.error("❌ No listing links found. Scroll to the bottom of fab.com/library so all assets load, then re-run.");
      return;
    }

    console.log(\`Found \${uids.length} listings. Fetching each page for metadata...\`);

    const BATCH = 6;
    for (let i = 0; i < uids.length; i += BATCH) {
      await Promise.all(uids.slice(i, i + BATCH).map(async uid => {
        try {
          const html = await (await fetch(\`/listings/\${uid}\`)).text();

          // Pull __NEXT_DATA__ from the listing page HTML
          const m = html.match(/<script id="__NEXT_DATA__"[^>]*>([\\s\\S]*?)<\\/script>/);
          if (m) {
            const pp = JSON.parse(m[1])?.props?.pageProps ?? {};
            const item = pp.listing ?? pp.asset ?? pp.product ?? pp.data
                      ?? Object.values(pp).find(v => v && typeof v === "object" && v.uid === uid);
            if (item?.title) { assets.push(fmtItem(item, uid)); return; }
          }

          // OG tag fallback (title + cover image at minimum)
          const title = html.match(/property="og:title"\\s+content="([^"]+)"/)?.[1]
                     || html.match(/<title>([^<|]+)/)?.[1]?.trim();
          const thumb = html.match(/property="og:image"\\s+content="([^"]+)"/)?.[1];
          assets.push({ name: title || uid, category: "Uncategorized", thumbnail: thumb || "",
                        url: \`https://www.fab.com/listings/\${uid}\`, price: "" });
        } catch {}
      }));
      console.log(\`  \${Math.min(i + BATCH, uids.length)}/\${uids.length} done...\`);
      await new Promise(r => setTimeout(r, 120));
    }
  }

  if (!assets.length) {
    console.error("❌ No assets found. Are you logged in and on fab.com/library?");
    return;
  }

  const output = JSON.stringify(assets, null, 2);
  console.log(\`\\n✅ \${assets.length} assets ready!\`);
  console.log("FAB_ASSETS_START");
  console.log(output);
  console.log("FAB_ASSETS_END");
  try {
    await navigator.clipboard.writeText(output);
    console.log("✅ Copied to clipboard automatically!");
  } catch {
    console.log("⚠️ Auto-copy blocked — manually copy the JSON between the markers above.");
  }
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
        <Step n={1} title="Go to fab.com/library, scroll all the way to the bottom, then open DevTools (F12 → Console) and run this">
          <CodeBlock code={SCRAPER} />
          <p style={{ fontSize: 12, color: "#6b6b80", marginTop: 10 }}>
            Tries Fab&apos;s internal API first (auto-paginates), then falls back to DOM scraping.
            Watch the console for progress. The output is copied to your clipboard automatically.
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
