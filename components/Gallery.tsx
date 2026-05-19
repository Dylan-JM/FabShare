"use client";

import { useEffect, useMemo, useState } from "react";
import type { FabAsset } from "@/lib/types";

interface GalleryProps {
  assets: FabAsset[];
  onBack: () => void;
}

interface IndexedAsset extends FabAsset {
  _index: number;
}

export default function Gallery({ assets: initialAssets, onBack }: GalleryProps) {
  const [assets] = useState<IndexedAsset[]>(() =>
    initialAssets.map((a, i) => ({ ...a, _index: i }))
  );
  const [search, setSearch] = useState("");
  const [selectedCat, setSelectedCat] = useState<string | null>(null);
  const [selectedSub, setSelectedSub] = useState<string | null>(null);
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set());

  // bit.ly state
  const [bitlyToken, setBitlyToken] = useState("");
  const [tokenInput, setTokenInput] = useState("");
  const [showTokenInput, setShowTokenInput] = useState(false);
  const [shortUrl, setShortUrl] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState("");
  const [shortCopied, setShortCopied] = useState(false);

  useEffect(() => {
    setBitlyToken(localStorage.getItem("fabshare_bitly_token") || "");
  }, []);

  const categoryTree = useMemo(() => {
    const tree: Record<string, { count: number; subs: Record<string, number> }> = {};
    for (const a of assets) {
      const cat = a.category || "Uncategorized";
      const sub = a.subcategory || "";
      if (!tree[cat]) tree[cat] = { count: 0, subs: {} };
      tree[cat].count++;
      if (sub) tree[cat].subs[sub] = (tree[cat].subs[sub] || 0) + 1;
    }
    return tree;
  }, [assets]);

  const sortedCats = useMemo(() => Object.keys(categoryTree).sort(), [categoryTree]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return assets.filter(a => {
      const cat = a.category || "Uncategorized";
      const sub = a.subcategory || "";
      const matchCat = selectedCat === null
        || (cat === selectedCat && (selectedSub === null || sub === selectedSub));
      const matchQ = !q
        || (a.name || "").toLowerCase().includes(q)
        || cat.toLowerCase().includes(q)
        || sub.toLowerCase().includes(q);
      return matchCat && matchQ;
    });
  }, [assets, search, selectedCat, selectedSub]);

  const doShorten = async (token: string) => {
    setIsGenerating(true);
    setGenerateError("");
    try {
      const res = await fetch("https://api-ssl.bitly.com/v4/shorten", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ long_url: window.location.href }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 401) {
          setBitlyToken("");
          localStorage.removeItem("fabshare_bitly_token");
          setShowTokenInput(true);
        }
        throw new Error((data as { message?: string }).message || `bit.ly error ${res.status}`);
      }
      const link = (data as { link: string }).link;
      setShortUrl(link);
      await navigator.clipboard.writeText(link).catch(() => {});
      setShortCopied(true);
      setTimeout(() => setShortCopied(false), 2500);
    } catch (e) {
      setGenerateError(e instanceof Error ? e.message : "Failed to generate link");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateLink = () => {
    setGenerateError("");
    setShortUrl("");
    if (bitlyToken) {
      doShorten(bitlyToken);
    } else {
      setTokenInput("");
      setShowTokenInput(true);
    }
  };

  const saveTokenAndGenerate = () => {
    const token = tokenInput.trim();
    if (!token) return;
    localStorage.setItem("fabshare_bitly_token", token);
    setBitlyToken(token);
    setShowTokenInput(false);
    doShorten(token);
  };

  const handleCatClick = (cat: string) => {
    setSelectedCat(cat);
    setSelectedSub(null);
    setExpandedCats(prev => new Set([...prev, cat]));
  };

  const handleCatChevron = (cat: string, e: { stopPropagation(): void }) => {
    e.stopPropagation();
    setExpandedCats(prev => {
      const next = new Set(prev);
      next.has(cat) ? next.delete(cat) : next.add(cat);
      return next;
    });
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0c", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <header style={{
        position: "sticky", top: 0, zIndex: 100, flexShrink: 0,
        background: "#0a0a0cee", backdropFilter: "blur(16px)",
        borderBottom: "1px solid #ffffff0f",
        padding: "0 20px", display: "flex", alignItems: "center", gap: 12, height: 64,
      }}>
        <button
          onClick={onBack}
          style={{ fontFamily: "var(--font-display)", fontSize: 26, letterSpacing: ".08em", color: "#e8622a", background: "none", border: "none", cursor: "pointer", flexShrink: 0 }}
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

        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 12, flexShrink: 0, position: "relative" }}>
          <span style={{ fontSize: 13, color: "#6b6b80", whiteSpace: "nowrap" }}>
            {filtered.length} of {assets.length}
          </span>

          {shortUrl ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <a
                href={shortUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: 13, color: "#e8622a", fontFamily: "monospace", whiteSpace: "nowrap" }}
              >
                {shortUrl}
              </a>
              <button
                onClick={() => { navigator.clipboard.writeText(shortUrl); setShortCopied(true); setTimeout(() => setShortCopied(false), 2500); }}
                style={{ background: "transparent", border: "1px solid #ffffff0f", color: "#6b6b80", padding: "5px 12px", borderRadius: 8, fontFamily: "inherit", fontSize: 12, cursor: "pointer" }}
              >
                {shortCopied ? "✓ Copied!" : "Copy"}
              </button>
              <button
                onClick={() => { setShortUrl(""); setGenerateError(""); }}
                title="Clear"
                style={{ background: "none", border: "none", color: "#6b6b80", cursor: "pointer", fontSize: 18, lineHeight: 1, padding: "0 2px" }}
              >
                ×
              </button>
            </div>
          ) : (
            <button
              onClick={handleGenerateLink}
              disabled={isGenerating}
              style={{
                background: "#e8622a", color: "#fff", border: "none",
                padding: "7px 16px", borderRadius: 8, fontFamily: "inherit", fontSize: 13,
                cursor: isGenerating ? "not-allowed" : "pointer",
                opacity: isGenerating ? 0.6 : 1,
                transition: "opacity .15s", whiteSpace: "nowrap",
              }}
            >
              {isGenerating ? "Generating…" : "Generate Shareable Link"}
            </button>
          )}

          {generateError && !showTokenInput && (
            <span style={{ position: "absolute", top: "calc(100% + 6px)", right: 0, fontSize: 12, color: "#e8622a", whiteSpace: "nowrap", background: "#0a0a0c", padding: "4px 8px", borderRadius: 6 }}>
              {generateError}
            </span>
          )}

          {/* bit.ly token input popover */}
          {showTokenInput && (
            <div style={{
              position: "absolute", top: "calc(100% + 10px)", right: 0, zIndex: 200,
              background: "#18181f", border: "1px solid #ffffff1a", borderRadius: 12,
              padding: 20, width: 310, boxShadow: "0 12px 40px #00000090",
            }}>
              <p style={{ fontSize: 13, fontWeight: 500, color: "#e8e8ee", marginBottom: 6 }}>
                bit.ly access token
              </p>
              <p style={{ fontSize: 12, color: "#6b6b80", marginBottom: 12, lineHeight: 1.5 }}>
                Get one free at{" "}
                <a href="https://app.bitly.com/settings/api" target="_blank" rel="noopener noreferrer" style={{ color: "#e8622a" }}>
                  app.bitly.com → Settings → API
                </a>
                . Saved to this browser only.
              </p>
              <input
                autoFocus
                type="password"
                value={tokenInput}
                onChange={e => setTokenInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && saveTokenAndGenerate()}
                placeholder="Paste token here…"
                style={{
                  width: "100%", background: "#111116", border: "1px solid #ffffff1a",
                  borderRadius: 7, padding: "8px 12px", color: "#e8e8ee",
                  fontFamily: "inherit", fontSize: 13, outline: "none", marginBottom: 8,
                  boxSizing: "border-box",
                }}
                onFocus={e => (e.target.style.borderColor = "#e8622a")}
                onBlur={e => (e.target.style.borderColor = "#ffffff1a")}
              />
              {generateError && (
                <p style={{ fontSize: 12, color: "#e8622a", marginBottom: 8 }}>{generateError}</p>
              )}
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => { setShowTokenInput(false); setGenerateError(""); }}
                  style={{ flex: 1, padding: "8px", background: "none", border: "1px solid #ffffff1a", borderRadius: 7, color: "#6b6b80", cursor: "pointer", fontFamily: "inherit", fontSize: 13 }}
                >
                  Cancel
                </button>
                <button
                  onClick={saveTokenAndGenerate}
                  disabled={!tokenInput.trim()}
                  style={{ flex: 1, padding: "8px", background: "#e8622a", border: "none", borderRadius: 7, color: "#fff", cursor: tokenInput.trim() ? "pointer" : "not-allowed", opacity: tokenInput.trim() ? 1 : 0.4, fontFamily: "inherit", fontSize: 13, fontWeight: 500 }}
                >
                  Save & Generate
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Body: sidebar + content */}
      <div style={{ display: "flex", flex: 1 }}>
        {/* Sidebar */}
        <aside style={{
          width: 220, flexShrink: 0,
          borderRight: "1px solid #ffffff0f",
          overflowY: "auto",
          position: "sticky",
          top: 64,
          height: "calc(100vh - 64px)",
          paddingTop: 8,
          paddingBottom: 32,
        }}>
          <button
            onClick={() => { setSelectedCat(null); setSelectedSub(null); }}
            style={{
              width: "100%", padding: "8px 20px",
              background: selectedCat === null ? "#e8622a12" : "none",
              border: "none",
              color: selectedCat === null ? "#e8622a" : "#e8e8ee",
              textAlign: "left", display: "flex", justifyContent: "space-between", alignItems: "center",
              cursor: "pointer", fontSize: 13, fontFamily: "inherit",
              fontWeight: selectedCat === null ? 500 : 400,
            }}
          >
            <span>All</span>
            <span style={{ color: "#6b6b80", fontSize: 11 }}>{assets.length}</span>
          </button>

          <div style={{ height: 1, background: "#ffffff0f", margin: "8px 0" }} />

          {sortedCats.map(cat => {
            const node = categoryTree[cat];
            const hasSubs = Object.keys(node.subs).length > 0;
            const isExpanded = expandedCats.has(cat);
            const isCatSelected = selectedCat === cat && selectedSub === null;

            return (
              <div key={cat}>
                <div style={{ display: "flex", alignItems: "center" }}>
                  {hasSubs ? (
                    <button
                      onClick={e => handleCatChevron(cat, e)}
                      style={{
                        flexShrink: 0, width: 28, height: 32,
                        background: "none", border: "none",
                        color: "#6b6b80", cursor: "pointer", fontSize: 15,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        paddingLeft: 10,
                      }}
                    >
                      <span style={{
                        display: "inline-block",
                        transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)",
                        transition: "transform .15s",
                        lineHeight: 1,
                      }}>›</span>
                    </button>
                  ) : (
                    <span style={{ width: 28, flexShrink: 0 }} />
                  )}
                  <button
                    onClick={() => handleCatClick(cat)}
                    style={{
                      flex: 1, minWidth: 0,
                      padding: "7px 14px 7px 4px",
                      background: isCatSelected ? "#e8622a12" : "none",
                      border: "none",
                      color: isCatSelected ? "#e8622a" : "#e8e8ee",
                      textAlign: "left",
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      cursor: "pointer", fontSize: 13, fontFamily: "inherit",
                      fontWeight: isCatSelected ? 500 : 400, gap: 4,
                    }}
                  >
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
                      {cat}
                    </span>
                    <span style={{ color: "#6b6b80", fontSize: 11, flexShrink: 0 }}>{node.count}</span>
                  </button>
                </div>

                {isExpanded && Object.entries(node.subs)
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([sub, count]) => {
                    const isSubSelected = selectedCat === cat && selectedSub === sub;
                    return (
                      <button
                        key={sub}
                        onClick={() => { setSelectedCat(cat); setSelectedSub(sub); }}
                        style={{
                          width: "100%", padding: "5px 14px 5px 40px",
                          background: isSubSelected ? "#e8622a12" : "none",
                          border: "none",
                          color: isSubSelected ? "#e8622a" : "#9090a8",
                          textAlign: "left",
                          display: "flex", justifyContent: "space-between", alignItems: "center",
                          cursor: "pointer", fontSize: 12, fontFamily: "inherit",
                          fontWeight: isSubSelected ? 500 : 400, gap: 4,
                        }}
                      >
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
                          {sub}
                        </span>
                        <span style={{ color: "#6b6b80", fontSize: 11, flexShrink: 0 }}>{count}</span>
                      </button>
                    );
                  })}
              </div>
            );
          })}
        </aside>

        {/* Grid */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {filtered.length > 0 ? (
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
              gap: 16, padding: "20px 20px 64px",
            }}>
              {filtered.map(asset => (
                <AssetCard key={asset._index} asset={asset} />
              ))}
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "80px 0", color: "#6b6b80" }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>🔍</div>
              <div>No assets match.</div>
              {(search || selectedCat !== null) && (
                <button
                  onClick={() => { setSearch(""); setSelectedCat(null); setSelectedSub(null); }}
                  style={{ marginTop: 12, background: "none", border: "none", color: "#e8622a", cursor: "pointer", fontSize: 13 }}
                >
                  Clear filters
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AssetCard({ asset }: { asset: IndexedAsset }) {
  const [imgError, setImgError] = useState(false);
  const isFree = asset.price?.toLowerCase() === "free" || asset.price === "0" || asset.price === "$0.00";
  const label = asset.subcategory || asset.category || "Uncategorized";

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
        }}>
          📦
        </div>
      )}

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
            {label}
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
