import type { FabAsset } from "./types";

export function parseAssets(raw: string): FabAsset[] {
  let s = raw
    .replace(/FAB_ASSETS_START|>>>FAB_START<<<|FAB_ASSETS_END|>>>FAB_END<<</g, "")
    .trim();

  const start = s.indexOf("[");
  if (start < 0) throw new Error("No JSON array found. Copy the full output between the start/end markers.");

  const end = s.lastIndexOf("]");
  if (end < start) throw new Error("JSON array is incomplete — did you copy the full output?");

  const jsonStr = s.slice(start, end + 1);

  let parsed: unknown[];
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    const fixed = jsonStr.replace(/,(\s*[}\]])/g, "$1");
    try {
      parsed = JSON.parse(fixed);
    } catch (e2) {
      const msg = e2 instanceof Error ? e2.message : String(e2);
      throw new Error(`JSON parse error: ${msg}\n\nTip: re-run the collector script, scroll the full library first, then copy again.`);
    }
  }

  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error("Array is empty. Make sure you scrolled through your entire library before running the collector.");
  }

  return parsed.map((item, i) => {
    const raw = item as Record<string, unknown>;

    let name = String(raw.name || raw.title || "");
    try { name = decodeURIComponent(name); } catch { /* ignore */ }

    const uid = String(raw.uid || "");
    const url = raw.url
      ? String(raw.url)
      : uid
      ? `https://www.fab.com/listings/${uid}`
      : "";

    const price = raw.price ?? raw.price_range ?? "";

    return {
      name: name || "Untitled",
      category: String(raw.category || raw.categories || "Uncategorized"),
      thumbnail: String(raw.thumbnail || raw.thumbnail_url || ""),
      url,
      price: String(price),
      subcategory: raw.subcategory ? String(raw.subcategory) : undefined,
      path: raw.path ? String(raw.path) : undefined,
      _index: i,
    };
  });
}
