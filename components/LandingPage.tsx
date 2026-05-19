"use client";

import { useState } from "react";
import { ArrowRight, Terminal } from "lucide-react";
import { encode } from "@/lib/codec";
import type { FabAsset } from "@/lib/types";
import CopyButton from "./CopyButton";

const INTERCEPTOR_SCRIPT = `// Step 1: Paste this, then REFRESH the page
const _fetch = window.fetch;
window._fabData = [];
window.fetch = async (...args) => {
  const res = await _fetch(...args);
  const clone = res.clone();
  try {
    const j = await clone.json();
    if (j?.results?.length) window._fabData.push(...j.results);
  } catch {}
  return res;
};
console.log('✅ Interceptor active. Refresh now, then scroll your full library.');`;

const COLLECTOR_SCRIPT = `// Step 2: Run this after scrolling through your entire library
const seen = new Set();
const assets = window._fabData
  .filter(item => {
    if (seen.has(item.uid)) return false;
    seen.add(item.uid);
    return true;
  })
  .map(item => ({
    title: item.title,
    category: item.categories?.[0]?.name ?? 'Uncategorized',
    thumbnail_url: item.thumbnail_url ?? '',
    uid: item.uid,
    price_range: item.price_range ?? 'Free',
  }));
copy(JSON.stringify(assets));
console.log(\`✅ Copied \${assets.length} assets. Paste into FabShare.\`);`;

export default function LandingPage() {
  const [json, setJson] = useState("");
  const [error, setError] = useState("");

  const handleGenerate = () => {
    setError("");
    try {
      const data = JSON.parse(json) as FabAsset[];
      if (!Array.isArray(data) || data.length === 0) {
        setError("Expected a non-empty array. Run the collector script in Step 2.");
        return;
      }
      const hash = encode(data);
      window.location.hash = hash;
    } catch {
      setError("Invalid JSON — paste the output from the collector script.");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-white/8 px-6 py-4 flex items-center gap-3">
        <span
          className="text-2xl text-accent tracking-wider"
          style={{ fontFamily: "var(--font-display)" }}
        >
          FabShare
        </span>
        <span className="text-muted text-sm">by the community</span>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-16 flex flex-col gap-14">
        {/* Hero */}
        <section className="flex flex-col gap-4">
          <h1
            className="text-6xl text-foreground leading-none"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Share your
            <br />
            <span className="text-accent">Fab library</span>
            <br />
            with your team
          </h1>
          <p className="text-muted text-lg max-w-lg">
            Scrape your Fab asset library straight from the browser, compress it
            into a URL, and send it. Anyone with the link sees your full
            gallery — no account needed, no server involved.
          </p>
        </section>

        {/* Step 1 */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <span className="flex items-center justify-center w-7 h-7 rounded-full bg-accent text-white text-sm font-bold">
              1
            </span>
            <h2 className="text-foreground font-semibold text-lg">
              Paste the interceptor in DevTools
            </h2>
          </div>
          <p className="text-muted text-sm pl-10">
            Open{" "}
            <a
              href="https://www.fab.com/library"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:underline"
            >
              fab.com/library
            </a>
            , open the browser console (F12 → Console), paste the snippet below,
            press Enter, then{" "}
            <strong className="text-foreground">refresh the page</strong>.
          </p>
          <div className="rounded-lg border border-white/8 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 bg-code border-b border-white/8">
              <div className="flex items-center gap-2 text-muted text-xs">
                <Terminal size={13} />
                DevTools Console
              </div>
              <CopyButton text={INTERCEPTOR_SCRIPT} />
            </div>
            <pre className="p-4 text-xs text-foreground/80 overflow-x-auto leading-relaxed bg-code font-mono no-scrollbar">
              <code>{INTERCEPTOR_SCRIPT}</code>
            </pre>
          </div>
        </section>

        {/* Step 2 */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <span className="flex items-center justify-center w-7 h-7 rounded-full bg-accent text-white text-sm font-bold">
              2
            </span>
            <h2 className="text-foreground font-semibold text-lg">
              Scroll your library, then collect
            </h2>
          </div>
          <p className="text-muted text-sm pl-10">
            After refreshing, scroll through your{" "}
            <strong className="text-foreground">entire library</strong> so all
            pages load. Then paste and run this second snippet — it copies the
            data to your clipboard.
          </p>
          <div className="rounded-lg border border-white/8 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 bg-code border-b border-white/8">
              <div className="flex items-center gap-2 text-muted text-xs">
                <Terminal size={13} />
                DevTools Console
              </div>
              <CopyButton text={COLLECTOR_SCRIPT} />
            </div>
            <pre className="p-4 text-xs text-foreground/80 overflow-x-auto leading-relaxed bg-code font-mono no-scrollbar">
              <code>{COLLECTOR_SCRIPT}</code>
            </pre>
          </div>
        </section>

        {/* Step 3 — paste + generate */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <span className="flex items-center justify-center w-7 h-7 rounded-full bg-accent text-white text-sm font-bold">
              3
            </span>
            <h2 className="text-foreground font-semibold text-lg">
              Paste the JSON and generate your link
            </h2>
          </div>
          <div className="pl-10 flex flex-col gap-3">
            <textarea
              value={json}
              onChange={(e) => setJson(e.target.value)}
              placeholder="Paste your JSON here..."
              rows={6}
              className="w-full rounded-lg border border-white/8 bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted resize-none focus:outline-none focus:border-accent/60 transition-colors font-mono"
            />
            {error && (
              <p className="text-red-400 text-sm">{error}</p>
            )}
            <button
              onClick={handleGenerate}
              disabled={!json.trim()}
              className="self-start flex items-center gap-2 px-5 py-2.5 rounded-lg bg-accent hover:bg-accent-hover text-white font-semibold text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              Generate Shareable Link
              <ArrowRight size={16} />
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
