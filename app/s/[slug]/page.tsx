"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Gallery from "@/components/Gallery";
import { decode } from "@/lib/codec";
import type { FabAsset } from "@/lib/types";

export default function SharedPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const [assets, setAssets] = useState<FabAsset[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/share/${slug}`)
      .then(r => r.json())
      .then((data: { hash?: string; error?: string }) => {
        if (data.error || !data.hash) {
          setError("Library not found.");
          return;
        }
        const decoded = decode<FabAsset[]>(data.hash);
        if (!decoded || !decoded.length) {
          setError("Could not decode library data.");
          return;
        }
        setAssets(decoded);
      })
      .catch(() => setError("Failed to load library."));
  }, [slug]);

  if (error) {
    return (
      <div style={{ minHeight: "100vh", background: "#0a0a0c", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16 }}>
        <span style={{ fontSize: 48 }}>📦</span>
        <p style={{ color: "#6b6b80", fontSize: 15 }}>{error}</p>
        <button
          onClick={() => router.push("/")}
          style={{ background: "#e8622a", color: "#fff", border: "none", padding: "9px 20px", borderRadius: 8, cursor: "pointer", fontSize: 14, fontFamily: "inherit" }}
        >
          Go home
        </button>
      </div>
    );
  }

  if (!assets) {
    return (
      <div style={{ minHeight: "100vh", background: "#0a0a0c", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "#6b6b80", fontSize: 14 }}>Loading…</p>
      </div>
    );
  }

  return <Gallery assets={assets} onBack={() => router.push("/")} />;
}
