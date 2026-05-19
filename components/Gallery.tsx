"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { FabAsset } from "@/lib/types";

interface GalleryProps {
  assets: FabAsset[];
  onBack: () => void;
}

interface EnrichedAsset extends FabAsset {
  _index: number;
  _needsEnrich: boolean;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const LISTING_RE = /listings\/([0-9a-f-]{36})/i;

export default function Gallery({ assets: initialAssets, onBack }: GalleryProps) {
  const [assets, setAssets] = useState<EnrichedAsset[]>(() =>
    initialAssets.map((a, i) => {
      const needsEnrich = UUID_RE.test((a.name || "").trim()) || !a.name || a.name === "…";
      return { ...a, _index: i, _needsEnrich: needsEnrich };
    })
  );
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [linkCopied, setLinkCopied] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const enriched = useRef(false);

  const categories = useMemo(() => {
    const cats = new Set(assets.map(a => a.category || "Uncategorized"));
    return ["All", ...Array.from(cats).sort()];
  }, [assets]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return assets.filter(a => {
      const matchCat = activeCategory === "All" || (a.category || "Uncategorized") === activeCategory;
      const matchQ = !q || (a.name || "").toLowerCase().includes(q) || (a.category || "").toLowerCase().includes(q);
      return matchCat && matchQ;
    });
  }, [assets, search, activeCategory]);

  const updateAsset = useCallback((index: number, patch: Partial<EnrichedAsset>) => {
    setAssets(prev => prev.map(a => a._index === index ? { ...a, ...patch } : a));
  }, []);

  useEffect(() => {
    if (enriched.current) return;
    const toEnrich = assets.filter(a => a._needsEnrich);
    if (toEnrich.length === 0) return;
    enriched.current = true;

    const BATCH = 5;
    let done = 0;
    const total = toEnrich.length;
    setProgress({ done: 0, total });

    (async () => {
      for (let i = 0; i < toEnrich.length; i += BATCH) {
        await Promise.all(
          toEnrich.slice(i, i + BATCH).map(async asset => {
            const uid = (asset.url.match(LISTING_RE) || [])[1];
            if (uid) {
              try {
                const r = await fetch(`https://www.fab.com/i/listings/${uid}`, {
                  headers: { accept: "application/json" },
                  credentials: "include",
                });
                if (r.ok) {
                  const d = await r.json();
                  const minPrice = d.price_range?.min;
                  updateAsset(asset._index, {
                    name: d.title || d.name || uid,
                    thumbnail: d.thumbnail_url || d.cover_image || d.images?.[0]?.url || "",
                    category: d.categories?.[0]?.name || d.category?.name || "Uncategorized",
                    price: minPrice != null ? (minPrice === 0 ? "Free" : `$${minPrice.toFixed(2)}`) : (d.is_free ? "Free" : asset.price),
                    _needsEnrich: false,
                  });
                }
              } catch { /* network error, keep placeholder */ }
            }
            done++;
            setProgress({ done, total });
          })
        );
        await new Promise(r => setTimeout(r, 200));
      }
      setProgress(null);
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const copyLink = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0c" }}>
      {/* Progress bar */}
      {progress && (
        <>
          <div style={{ position: "fixed", top: 64, left: 0, right: 0, height: 3, background: "#18181f", zIndex: 200 }}>
            <div style={{ height: "100%", background: "#e8622a", width: `${Math.round(progress.done / progress.total * 100)}%`, transition: "width .3s" }} />
          </div>
          <div style={{
            position: "fixed", top: 72, right: 32, zIndex: 200,
            background: "#111116", border: "1px solid #ffffff0f", borderRadius: 6,
            padding: "4px 10px", fontSize: 12, color: "#6b6b80",
          }}>
            Fetching {progress.done}/{progress.total}…
          </div>
        </>
      )}

      {/* Header */}
      <header style={{
        position: "sticky", top: 0, zIndex: 100,
        background: "#0a0a0cee", backdropFilter: "blur(16px)",
        borderBottom: "1px solid #ffffff0f",
        padding: "0 32px", display: "flex", alignItems: "center", gap: 16, height: 64,
      }}>
        <button
          onClick={onBack}
          style={{ fontFamily: "var(--font-display)", fontSize: 26, letterSpacing: ".08em", color: "#e8622a", background: "none", border: "none", cursor: "pointer" }}
        >
          Fab<span style={{ color: "#e8e8ee" }}>Share</span>
        </button>

        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search assets…"
          autoComplete="off"
          style={{
            flex: 1, maxWidth: 480, background: "#18181f", border: "1px solid #ffffff0f",
            borderRadius: 8, padding: "8px 14px", color: "#e8e8ee",
            fontFamily: "inherit", fontSize: 14, outline: "none", transition: "border-color .2s",
          }}
          onFocus={e => (e.target.style.borderColor = "#e8622a")}
          onBlur={e => (e.target.style.borderColor = "#ffffff0f")}
        />

        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ fontSize: 13, color: "#6b6b80", whiteSpace: "nowrap" }}>
            {filtered.length} of {assets.length} assets
          </span>
          <button
            onClick={copyLink}
            style={{
              background: "transparent", border: "1px solid #ffffff0f", color: "#6b6b80",
              padding: "6px 14px", borderRadius: 8, fontFamily: "inherit", fontSize: 13,
              cursor: "pointer", transition: "all .15s", whiteSpace: "nowrap",
            }}
            onMouseEnter={e => { (e.target as HTMLButtonElement).style.borderColor = "#e8622a"; (e.target as HTMLButtonElement).style.color = "#e8622a"; }}
            onMouseLeave={e => { (e.target as HTMLButtonElement).style.borderColor = "#ffffff0f"; (e.target as HTMLButtonElement).style.color = "#6b6b80"; }}
          >
            {linkCopied ? "✓ Copied!" : "🔗 Copy link"}
          </button>
        </div>
      </header>

      {/* Category filters */}
      <div style={{ display: "flex", padding: "20px 32px 0", gap: 8, flexWrap: "wrap" }}>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            style={{
              background: cat === activeCategory ? "#e8622a18" : "#18181f",
              border: `1px solid ${cat === activeCategory ? "#e8622a" : "#ffffff0f"}`,
              color: cat === activeCategory ? "#e8622a" : "#6b6b80",
              padding: "5px 14px", borderRadius: 20,
              fontFamily: "inherit", fontSize: 13, cursor: "pointer", transition: "all .15s",
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid */}
      {filtered.length > 0 ? (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          gap: 18, padding: "24px 32px 64px",
        }}>
          {filtered.map(asset => (
            <AssetCard key={asset._index} asset={asset} />
          ))}
        </div>
      ) : (
        <div style={{ textAlign: "center", padding: "80px 0", color: "#6b6b80" }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🔍</div>
          <div>No assets match.</div>
          {(search || activeCategory !== "All") && (
            <button
              onClick={() => { setSearch(""); setActiveCategory("All"); }}
              style={{ marginTop: 12, background: "none", border: "none", color: "#e8622a", cursor: "pointer", fontSize: 13 }}
            >
              Clear filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function AssetCard({ asset }: { asset: EnrichedAsset }) {
  const [imgError, setImgError] = useState(false);
  const isFree = asset.price?.toLowerCase() === "free" || asset.price === "0" || asset.price === "$0.00";

  return (
    <a
      href={asset.url || "#"}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        background: "#111116", border: "1px solid #ffffff0f", borderRadius: 10,
        overflow: "hidden", textDecoration: "none", color: "inherit",
        display: "flex", flexDirection: "column",
        transition: "transform .2s, border-color .2s, box-shadow .2s",
      }}
      onMouseEnter={e => {
        const el = e.currentTarget;
        el.style.transform = "translateY(-4px)";
        el.style.borderColor = "#e8622a66";
        el.style.boxShadow = "0 12px 40px #00000060, 0 0 0 1px #e8622a22";
      }}
      onMouseLeave={e => {
        const el = e.currentTarget;
        el.style.transform = "";
        el.style.borderColor = "#ffffff0f";
        el.style.boxShadow = "";
      }}
    >
      {/* Thumbnail */}
      {asset.thumbnail && !imgError ? (
        <img
          src={asset.thumbnail}
          alt={asset.name}
          loading="lazy"
          onError={() => setImgError(true)}
          style={{ width: "100%", aspectRatio: "16/10", objectFit: "cover", display: "block" }}
        />
      ) : (
        <div style={{
          width: "100%", aspectRatio: "16/10", background: "#18181f",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 28, color: "#6b6b80",
          ...(asset._needsEnrich ? shimmerStyle : {}),
        }}>
          {asset._needsEnrich ? "" : "📦"}
        </div>
      )}

      {/* Info */}
      <div style={{ padding: "11px 13px 13px", display: "flex", flexDirection: "column", gap: 5, flex: 1 }}>
        <div style={{
          fontSize: 13, fontWeight: 500, lineHeight: 1.35,
          display: "-webkit-box", WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical", overflow: "hidden",
        }}>
          {asset.name || "…"}
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "auto", paddingTop: 6 }}>
          <span style={{
            fontSize: 11, color: "#6b6b80", background: "#18181f",
            border: "1px solid #ffffff0f", borderRadius: 4, padding: "2px 7px",
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "70%",
          }}>
            {asset.category || "Uncategorized"}
          </span>
          {asset.price && (
            <span style={{ fontSize: 12, fontWeight: 500, color: isFree ? "#4caf8a" : "#f5a623" }}>
              {isFree ? "Free" : asset.price}
            </span>
          )}
        </div>
      </div>
    </a>
  );
}

const shimmerStyle: React.CSSProperties = {
  position: "relative",
  overflow: "hidden",
};
