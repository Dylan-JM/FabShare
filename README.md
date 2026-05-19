# FabShare

Share your [Fab](https://www.fab.com) asset library with your team via a single URL — no backend, no accounts, no uploads.

The entire library is scraped from Fab's internal API, compressed with gzip, and encoded into the URL hash. Anyone with the link sees your full gallery rendered client-side.

## How it works

```
You (fab.com) → scrape → paste JSON → compressed URL → teammate opens link → gallery
```

The URL looks like: `yoursite.com/#eJyrVkqtSi0...`

Everything is in the hash — no server ever sees your data.

## Using the app

### Step 1 — Intercept Fab's API

Open [fab.com/library](https://www.fab.com/library), open the browser console (`F12 → Console`), and paste:

```js
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
console.log('✅ Interceptor active. Refresh the page now, then scroll your full library.');
```

Press Enter, then **refresh the page** (the interceptor must be active before the page loads its data).

### Step 2 — Collect the data

Scroll through your **entire library** so all pages load. Then run this second snippet:

```js
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
console.log(`✅ Copied ${assets.length} assets. Paste into FabShare.`);
```

This deduplicates results and copies them to your clipboard.

### Step 3 — Generate the link

Paste the JSON into the app and click **Generate Shareable Link**. Share the URL with your team.

---

## Running locally

```bash
git clone https://github.com/yourname/fabshare
cd fabshare
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploying

### Vercel (recommended)

Connect the repo to Vercel — it auto-detects Next.js and deploys with zero config.

### Netlify / GitHub Pages

```bash
npm run build   # outputs to out/
```

Drop the `out/` folder as your publish directory, or point your host's build settings to:
- **Build command:** `npm run build`
- **Publish directory:** `out`

## Tech stack

- [Next.js 16](https://nextjs.org) — static export (`output: 'export'`)
- [Tailwind CSS v4](https://tailwindcss.com)
- [fflate](https://github.com/101arrowz/fflate) — gzip compression for the URL payload
- [lucide-react](https://lucide.dev) — icons

## Project structure

```
app/
  layout.tsx        # fonts (Bebas Neue + DM Sans), metadata
  page.tsx          # hash router — landing vs gallery
  globals.css       # dark theme tokens
components/
  LandingPage.tsx   # scraper instructions + JSON paste
  GalleryPage.tsx   # search, category filters, card grid
  AssetCard.tsx     # thumbnail card → fab.com/listings/<uid>
  CopyButton.tsx    # clipboard button with confirmation state
lib/
  codec.ts          # encode/decode (gzip + base64url)
  types.ts          # FabAsset interface
  utils.ts          # cn() helper
```

## Why intercept fetch instead of scraping the DOM?

Fab's library page is a React SPA that fetches listing data via internal API calls as you scroll. Reading the DOM gives you UUIDs and "Uncategorized" for everything because React hasn't finished rendering the data into the DOM yet. Intercepting `window.fetch` captures the raw API responses — real titles, categories, and thumbnails.
