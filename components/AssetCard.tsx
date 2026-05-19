import { useState } from "react";
import type { FabAsset } from "@/lib/types";

interface AssetCardProps {
  asset: FabAsset;
}

export default function AssetCard({ asset }: AssetCardProps) {
  const [imgError, setImgError] = useState(false);

  const handleClick = () => {
    window.open(`https://www.fab.com/listings/${asset.uid}`, "_blank", "noopener,noreferrer");
  };

  const isFree =
    !asset.price_range ||
    asset.price_range === "Free" ||
    asset.price_range === "0" ||
    asset.price_range === "$0.00";

  return (
    <article
      onClick={handleClick}
      className="group flex flex-col rounded-lg border border-white/8 bg-card hover:bg-card-hover hover:border-white/14 transition-all cursor-pointer overflow-hidden"
    >
      {/* Thumbnail */}
      <div className="relative w-full" style={{ aspectRatio: "16/10" }}>
        {!imgError && asset.thumbnail_url ? (
          <img
            src={asset.thumbnail_url}
            alt={asset.title}
            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full bg-code flex items-center justify-center">
            <span className="text-muted text-xs">No preview</span>
          </div>
        )}
        {/* Price badge */}
        <div className="absolute top-2 right-2">
          <span
            className={`px-2 py-0.5 rounded text-xs font-semibold ${
              isFree
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                : "bg-accent/20 text-accent border border-accent/30"
            }`}
          >
            {isFree ? "Free" : asset.price_range}
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="flex flex-col gap-1.5 px-3 py-3">
        <h3 className="text-foreground text-sm font-medium leading-tight line-clamp-2 group-hover:text-accent transition-colors">
          {asset.title}
        </h3>
        <span className="text-muted text-xs">{asset.category}</span>
      </div>
    </article>
  );
}
