# FabShare

Share your [Fab](https://www.fab.com) asset library with your team via a short, readable URL.

The scraper runs in your browser's DevTools console, extracts your library with 12 concurrent workers, and posts the compressed data to a Vercel KV backend. Anyone with the link sees your full gallery — categories, thumbnails, prices — rendered client-side.

## How it works

```
fab.com/library → run script → copy JSON → paste → pick a name → yoursite.com/s/dylanslibrary
```

The JSON is gzip-compressed and stored server-side. The shared URL is just a short slug — no data in the URL itself.

## Using the app

### Step 1 — Scroll your library

Go to [fab.com/library](https://www.fab.com/library), log in, and scroll all the way to the **bottom** so every asset card is loaded.

### Step 2 — Run the scraper

Open DevTools (`F12 → Console`), copy the script from the app's **Step 1** panel, and paste it into the console.

The scraper:
- Walks every listing card in the DOM, extracting the name and thumbnail directly from the page (no extra fetch needed for those)
- Fetches each listing page concurrently (12 workers) to get the full category path, price, and high-res thumbnail
- Parses categories from `/category/slug/sub-slug` hrefs — same hierarchy Fab uses in its own sidebar
- Marks any unavailable listings as **Discontinued** rather than dropping them (their card name/thumbnail are preserved from the DOM)

Watch the console for progress (`20/340 done…`). When it finishes run `copy(window._fabResult)` in the console to copy the JSON.

### Step 3 — Generate the link

Paste the JSON into the app and click **Generate Shareable Link**. A popover lets you optionally choose a custom name (e.g. `dylanslibrary`) — leave it blank for a random 8-character slug.

Your link will be `yoursite.com/s/dylanslibrary`. It's automatically copied to your clipboard.

### Building a group library

Anyone viewing a shared library can click **+ Add your library** in the header, paste their own scraped JSON, and merge it in. Duplicates (matched by Fab listing URL) are skipped automatically. Once merged, click **Generate Shareable Link** to save the combined library as a new slug that everyone can access.

---

## Running locally

```bash
git clone https://github.com/yourname/fabshare
cd fabshare
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The "Generate Shareable Link" feature requires Vercel KV — see below.

## Deploying to Vercel

1. Connect the repo to Vercel — it auto-detects Next.js and deploys with zero config.
2. In the Vercel dashboard go to **Storage → Upstash → Create**, choose **Redis**, and attach it to your project.
3. Vercel automatically injects the required env vars (`UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`).

That's it. Shared links (`/s/<slug>`) resolve via the API route and render the gallery.

## Tech stack

- [Next.js 16](https://nextjs.org) — App Router with API routes
- [fflate](https://github.com/101arrowz/fflate) — gzip compression for the library payload
- [@upstash/redis](https://upstash.com) — serverless Redis for short slug storage
- TypeScript throughout

## Project structure

```
app/
  layout.tsx              # fonts (Bebas Neue + DM Sans), metadata
  page.tsx                # hash router — landing vs gallery
  globals.css             # dark theme tokens
  api/
    share/
      route.ts            # POST /api/share — store hash, return slug
      [slug]/
        route.ts          # GET /api/share/[slug] — look up hash by slug
  s/
    [slug]/
      page.tsx            # shared gallery page — fetches hash, renders Gallery
components/
  Importer.tsx            # scraper instructions + JSON paste UI
  Gallery.tsx             # category sidebar, search, card grid, share popover
  CopyButton.tsx          # clipboard button with confirmation state
lib/
  codec.ts                # encode/decode (gzip + base64url via fflate)
  parser.ts               # robust JSON parser for scraper output
  types.ts                # FabAsset interface
```
