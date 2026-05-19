# FabShare

Share your [Fab](https://www.fab.com) asset library with your team via a single URL — no backend, no accounts, no uploads.

The entire library is scraped from Fab, compressed with gzip, and encoded into the URL hash. Anyone with the link sees your full gallery rendered client-side.

## How it works

```
You (fab.com/library) → run script → copy JSON → generate URL → teammate opens link → gallery
```

The URL looks like: `yoursite.com/#eJyrVkqtSi0...`

Everything is in the hash — no server ever sees your data.

## Using the app

### Step 1 — Scroll your library

Go to [fab.com/library](https://www.fab.com/library), log in, and scroll all the way to the **bottom** so every asset card is loaded.

### Step 2 — Run the scraper

Open DevTools (`F12 → Console`), copy the script from the app's **Step 1** panel, and paste it into the console.

The script works entirely on Fab's public listing pages — no private API calls:

1. Looks for existing asset data already embedded in the page
2. Falls back to collecting listing UIDs from visible links and fetching each listing page to read its title, category, thumbnail, and price

Watch the console for progress. When it finishes you'll see `✅ X assets ready!` and the JSON is copied to your clipboard automatically.

### Step 3 — Generate the link

Paste the copied JSON into the app and click **Generate Shareable Link**. Share the URL with your team — no account needed to view it.

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
  Importer.tsx      # scraper instructions + JSON paste
  Gallery.tsx       # search, category filters, card grid
  CopyButton.tsx    # clipboard button with confirmation state
lib/
  codec.ts          # encode/decode (gzip + base64url)
  parser.ts         # robust JSON parser for scraper output
  types.ts          # FabAsset interface
```
