"use client";

import { useEffect, useState } from "react";
import Gallery from "@/components/Gallery";
import Importer from "@/components/Importer";
import { decode } from "@/lib/codec";
import type { FabAsset } from "@/lib/types";

type View = "loading" | "import" | "gallery";

export default function Page() {
  const [view, setView] = useState<View>("loading");
  const [assets, setAssets] = useState<FabAsset[]>([]);

  const loadHash = (hash: string): boolean => {
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
    if (!loadHash(window.location.hash.slice(1))) setView("import");

    const onHashChange = () => {
      if (!loadHash(window.location.hash.slice(1))) setView("import");
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  const handleImport = (data: FabAsset[]) => {
    setAssets(data);
    setView("gallery");
  };

  const handleBack = () => {
    history.pushState("", document.title, window.location.pathname + window.location.search);
    setAssets([]);
    setView("import");
  };

  if (view === "loading") return null;
  if (view === "gallery") return <Gallery assets={assets} onBack={handleBack} />;
  return <Importer onImport={handleImport} />;
}
