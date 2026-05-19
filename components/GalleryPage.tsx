"use client";

import { useMemo, useState } from "react";
import { Check, Link, Search } from "lucide-react";
import type { FabAsset } from "@/lib/types";
import AssetCard from "./AssetCard";
import { cn } from "@/lib/utils";

interface GalleryPageProps {
  assets: FabAsset[];
}

export default function GalleryPage({ assets }: GalleryPageProps) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [linkCopied, setLinkCopied] = useState(false);

  const categories = useMemo(() => {
    const cats = new Set(assets.map((a) => a.category));
    return ["All", ...Array.from(cats).sort()];
  }, [assets]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return assets.filter((a) => {
      const matchesSearch = !q || a.title.toLowerCase().includes(q);
      const matchesCategory =
        activeCategory === "All" || a.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [assets, search, activeCategory]);

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="sticky top-0 z-20 border-b border-white/8 bg-background/90 backdrop-blur-sm px-6 py-3 flex items-center justify-between">
        <a
          href="/"
          className="text-2xl text-accent tracking-wider hover:text-accent-hover transition-colors"
          style={{ fontFamily: "var(--font-display)" }}
        >
          FabShare
        </a>
        <div className="flex items-center gap-3">
          <span className="text-muted text-sm">
            {assets.length} asset{assets.length !== 1 ? "s" : ""}
          </span>
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/8 hover:border-accent/40 bg-card hover:bg-card-hover text-sm text-muted hover:text-foreground transition-all cursor-pointer"
          >
            {linkCopied ? <Check size={14} /> : <Link size={14} />}
            {linkCopied ? "Copied!" : "Copy link"}
          </button>
        </div>
      </nav>

      <main className="max-w-[1400px] mx-auto px-6 py-8 flex flex-col gap-6">
        {/* Search */}
        <div className="relative max-w-md">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search assets..."
            className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-white/8 bg-card text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-accent/50 transition-colors"
          />
        </div>

        {/* Category pills */}
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer border",
                activeCategory === cat
                  ? "bg-accent border-accent text-white"
                  : "bg-card border-white/8 text-muted hover:text-foreground hover:border-white/20"
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Results count */}
        {search || activeCategory !== "All" ? (
          <p className="text-muted text-sm">
            {filtered.length} result{filtered.length !== 1 ? "s" : ""}
            {activeCategory !== "All" ? ` in ${activeCategory}` : ""}
            {search ? ` for "${search}"` : ""}
          </p>
        ) : null}

        {/* Grid */}
        {filtered.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {filtered.map((asset) => (
              <AssetCard key={asset.uid} asset={asset} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <p className="text-muted text-sm">No assets match your filters.</p>
            <button
              onClick={() => {
                setSearch("");
                setActiveCategory("All");
              }}
              className="text-accent text-sm hover:underline cursor-pointer"
            >
              Clear filters
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
