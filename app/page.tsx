"use client";

import { useEffect, useState } from "react";
import LandingPage from "@/components/LandingPage";
import GalleryPage from "@/components/GalleryPage";
import { decode } from "@/lib/codec";
import type { FabAsset } from "@/lib/types";

type View = "loading" | "landing" | "gallery";

export default function Page() {
  const [view, setView] = useState<View>("loading");
  const [assets, setAssets] = useState<FabAsset[]>([]);

  const tryLoadHash = (hash: string) => {
    if (!hash) return false;
    const data = decode<FabAsset[]>(hash);
    if (data && Array.isArray(data) && data.length > 0) {
      setAssets(data);
      setView("gallery");
      return true;
    }
    return false;
  };

  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (!tryLoadHash(hash)) setView("landing");

    const onHashChange = () => {
      const newHash = window.location.hash.slice(1);
      if (!tryLoadHash(newHash)) setView("landing");
    };

    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  if (view === "loading") return null;
  if (view === "gallery") return <GalleryPage assets={assets} />;
  return <LandingPage />;
}
