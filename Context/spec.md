# Project spec — Hyderabad Companies Map

This file is the **as-built** source of truth for agents and humans. Original map intent: `Context/Map.md`. Do not assume `src/data/companies.ts` exists; it was deleted. Runtime listings are **MongoDB only**.

## Purpose

Public discovery site for companies in **Hyderabad, Telangana, India**, plus a **separate** Bengaluru map and directory:

1. Interactive clustered MapLibre map (`/`) — Hyderabad `companies` only
2. Crawlable industry directory (`/companies`) — same Hyderabad collection
3. Bengaluru clustered map (`/bengaluru`) and directory (`/bengaluru/companies`) — collection `bengaluru_listings`, never mixed into Hyderabad `companies`
4. About, Privacy, Terms, Contact for AdSense *readiness*

No auth, search, filters, jobs, admin, or payments. AdSense is **gated**: both maps show a bottom overlay row (portfolio, ad tray, legal links); `adsbygoogle.js` loads only in production when a publisher ID and at least one slot ID are set. No Auto ads.

This site is **not affiliated** with Google, Bangalore Startup Map, or the companies listed. Bengaluru names are loaded from a gitignored snapshot (curated public source: bangalorestartupmap.com) into MongoDB; the app never scrapes at request time.

## Stack

| Layer | Choice |
| --- | --- |
| App | Next.js **16.3.4** App Router (`hyderabad-map/` is the repo root) |
| UI | React **19.2.8** |
| Language | TypeScript |
| Map | MapLibre GL JS **6.7** only (`import * as maplibregl from "maplibre-gl"`) |
| Styles | Tailwind CSS v4; marker/popup CSS in `src/app/globals.css` |
| Database | MongoDB Atlas + Mongoose **9** |
| Runtime data | Collection `companies` (Hyderabad) on `/`, `/companies`, `GET /api/companies`; collection `bengaluru_listings` on `/bengaluru` (mappable rows) and `/bengaluru/companies` |

Fonts: Geist / Geist Mono. Site name: `Hyderabad Companies Map` (`src/lib/site.ts`).

## Architecture

```
Browser
  GET /  →  page.tsx (Server, force-dynamic)
              getCompanies() → DbConnect → CompanyModel.find().sort({ name: 1 })
              toCompany() → StartupMap companies={...}  (Hyderabad defaults)
  GET /companies → same getCompanies(), grouped by industry in HTML
  GET /bengaluru → getBengaluruMapCompanies()
              getBengaluruListings() → listingToMapCompany() (coords required)
              StartupMap (Bengaluru center/zoom/title, directoryHref=/bengaluru/companies)
  GET /bengaluru/companies → getBengaluruListings() (all rows, including unmapped)
  GET /api/companies → JSON array of Company   (Hyderabad only; no /api/bengaluru)
```

`StartupMap` / `CompanyPopup` / `AdTray` are `'use client'`. MapLibre is created in `useEffect` (never on the server).

**Isolation:** Do not write Bengaluru rows into `companies`. Do not call `getCompanies()` from Bengaluru routes. Do not add `src/app/(content)/bengaluru` — that URL collides with `src/app/bengaluru` (Next.js parallel-pages error).

## How to run

```bash
npm run dev      # http://localhost:3000/
npm run build
npm run start
npm run lint
```

`postinstall` runs `scripts/copy-maplibre-worker.mjs` → `public/maplibre/maplibre-gl-worker.mjs` and `maplibre-gl-shared.mjs`.

`npm run seed` is **disabled** (`scripts/seed-companies.ts` prints an error and `process.exit(1)`). There is no local seed array.

`npm run import:bengaluru` upserts `data/bengaluru-source.json` (gitignored via `/data/*.json`) into collection `bengaluru_listings` with `bulkWrite` `{ upsert: true }` keyed by `id` (source `slug`). It does not write to `companies`. Snapshot field map: `slug` → `id`, `sector` → `industry`, `area` → `city`, `lat`/`lng` → `latitude`/`longitude`, `hsr_location` → `hsrLocation`, `founded_year` → `foundedYear`. Missing snapshot → script exits `1`. Runtime pages never read that JSON file.

### Environment (`.env`, gitignored)

`.env.local` must **not** override these. Templates: `.env.example`.

| Variable | Role |
| --- | --- |
| `MONGODB_URI` | Atlas connection string (required). Missing → `DbConnect` throws `"MONGODB_URI is missing"`. |
| `MONGODB_DNS_SERVERS` | Optional comma-separated DNS (e.g. `1.1.1.1,8.8.8.8`). |
| `NEXT_PUBLIC_SITE_URL` | Canonical URL, no trailing slash. Default `http://localhost:3000`. Used for `metadataBase`, Open Graph, sitemap, robots. |
| `NEXT_PUBLIC_CONTACT_EMAIL` | Shown on Contact, Privacy, footer. Empty → Contact page tells the operator to set it. |
| `NEXT_PUBLIC_ADSENSE_CLIENT` | Optional `ca-pub-…`. Required (with at least one slot) for live ads in production. |
| `NEXT_PUBLIC_ADSENSE_SLOT_1` … `_5` | Optional display slot IDs for the five square units. Empty → dashed placeholder. |
| `NEXT_PUBLIC_ADSENSE_SLOT_TEXT` | Optional horizontal unit under the squares. |

## Routes

| Path | What it is |
| --- | --- |
| `/` | Full-viewport Hyderabad map. `StartupMap` uses default center/zoom/title/`directoryHref=/companies`. Failure UI: check `MONGODB_URI` / Atlas (does **not** mention seed). Overlays: title card (top-left); bottom row `MapBottomBar` — Portfolio (left), AdSense tray (center), `MapLegalLinks` (right). |
| `/companies` | Directory grouped by industry; cards with name, city, description, Website. `force-dynamic`. |
| `/bengaluru` | Full-viewport Bengaluru map. Same `StartupMap` clustering/popups/ads as `/`. Props: `BENGALURU_CENTER`, zoom `10.8`, `minZoom: 8`, title “Companies in Bengaluru”, `directoryHref=/bengaluru/companies`. Only listings with finite `latitude`/`longitude`. Failure UI: Mongo. |
| `/bengaluru/companies` | Directory of all Bengaluru startups and VCs, grouped by kind (Startups, Venture capital) then sector. Cards may include tagline, stage, founders, founded year, website. Attribution: independent of Bangalore Startup Map. Empty state mentions `npm run import:bengaluru`. `force-dynamic`. No `GET /api/bengaluru`. |
| `/about` | Independent directory; Hyderabad vs Bengaluru collections; map tech; ads may appear on the maps. |
| `/privacy` | Privacy Policy (last updated 7 September 2026): no accounts, server logs, essential storage, GA, OpenFreeMap / Google favicons, AdSense on the map when enabled. |
| `/terms` | Terms of Use: informational listings, ads on the map, no scraping/abuse, no fake ad clicks. |
| `/contact` | Correction/removal requests; `mailto:` if email env is set. |
| `/sitemap.xml` | `/`, `/companies`, `/bengaluru`, `/bengaluru/companies`, `/about`, `/privacy`, `/terms`, `/contact`. |
| `/robots.txt` | Allow `/`, disallow `/api/`, sitemap URL. |
| `/ads.txt` | `text/plain` Google seller line when `NEXT_PUBLIC_ADSENSE_CLIENT` is set; otherwise `404`. |
| `GET /api/companies` | JSON Hyderabad companies or `500` `{ error }`. |

Content pages use route group `src/app/(content)/` with `SiteHeader` + `SiteFooter` (`max-w-5xl`). Map routes (`/`, `/bengaluru`) do **not** use that layout. `/bengaluru/companies` uses `src/app/bengaluru/companies/layout.tsx` with the same header/footer chrome (cannot live under `(content)`).

Header nav: Map, Directory, Bengaluru, About, Contact. Footer: About, Privacy, Terms, Contact, email; copy mentions Hyderabad plus a Bengaluru listings page and non-affiliation.

## File map

```
src/app/layout.tsx                 metadata, gtag, CookieNotice, scrollable html/body
src/app/page.tsx                   getCompanies() → StartupMap (Hyderabad defaults)
src/app/bengaluru/page.tsx         getBengaluruMapCompanies() → StartupMap (Bengaluru props)
src/app/bengaluru/companies/layout.tsx  SiteHeader + SiteFooter (not (content) group)
src/app/bengaluru/companies/page.tsx    directory of all Bengaluru listings
src/app/sitemap.ts
src/app/robots.ts
src/app/ads.txt/route.ts           Google ads.txt when publisher ID is set
src/app/globals.css
src/app/api/companies/route.ts
src/app/(content)/layout.tsx
src/app/(content)/{about,privacy,terms,contact,companies}/page.tsx
src/components/map/StartupMap.tsx  HYDERABAD_CENTER, BENGALURU_CENTER; optional viewport/copy props
src/components/map/CompanyPopup.tsx
src/components/map/MapBottomBar.tsx    portfolio + ads + legal; directoryHref
src/components/map/MapLegalLinks.tsx   Directory (directoryHref), Bengaluru, About, Privacy, Contact
src/components/map/MapPortfolioLink.tsx  https://utkrsh-singh.vercel.app/
src/components/ads/AdTray.tsx      overlay tray; sessionStorage hyd-map-ad-tray
src/components/ads/AdSlot.tsx
src/components/site/SiteHeader.tsx
src/components/site/SiteFooter.tsx
src/components/site/CookieNotice.tsx   localStorage key hyd-map-cookie-notice
src/lib/site.ts
src/lib/adsense.ts                 client, slots, isAdsenseEnabled()
src/lib/mongodb.ts                 default export DbConnect
src/lib/companies.ts               getCompanies()
src/lib/bengaluru.ts               getBengaluruListings(), getBengaluruMapCompanies(), listingToMapCompany()
src/types/company.ts               Company + logoFor()
src/types/bengaluru-listing.ts     BengaluruKind, BengaluruListing (optional coordinates)
src/models/Company.ts              CompanyModel, toCompany(), collection "companies"
src/models/BengaluruListing.ts     BengaluruListingModel, toBengaluruListing(), collection "bengaluru_listings"
scripts/seed-companies.ts          disabled
scripts/import-bengaluru.ts        upserts data/bengaluru-source.json (gitignored)
scripts/copy-maplibre-worker.mjs
public/maplibre/
data/                              gitignored JSON snapshots; not served
next.config.ts                     serverExternalPackages: ["mongoose"]; turbopack.root; webpack noParse maplibre-gl
Context/spec.md                    this file
Context/Map.md                     original brief
```

**Do not import** `@/data/companies`. Types: `@/types/company`. Bengaluru listings use `@/types/bengaluru-listing` and must not be written to collection `companies`.

## Data model

### Hyderabad (`companies`)

```ts
interface Company {
  id: string;            // unique business key (not Mongo _id)
  name: string;
  description: string;
  industry: string;
  city: string;          // typically "Hyderabad"
  latitude: number;
  longitude: number;
  website?: string;
  logo?: string;
}
```

- **Source of truth:** MongoDB. Insert/update documents with the fields above. Unique index on `id`.
- Schema: `id: false` so Mongoose does not shadow the string `id` with `_id`. `timestamps: true`, `versionKey: false`.
- `toCompany()` maps lean docs; `logo` = stored logo or `logoFor(website)` (`https://www.google.com/s2/favicons?domain={hostname}&sz=128`).
- Coordinates are approximate districts (HITEC City, Gachibowli, Genome Valley, etc.). Clustering is required.
- Historical seed was ~517 rows; live count is whatever is in Atlas.

### Bengaluru (`bengaluru_listings`)

```ts
type BengaluruKind = "startup" | "vc";

interface BengaluruListing {
  id: string;            // source slug; unique
  name: string;
  kind: BengaluruKind;
  description: string;
  industry: string;      // source sector, default "Other"
  city: string;          // source area, default "Bengaluru"
  tagline?: string;
  stage?: string;
  hsrLocation?: string;
  latitude?: number;     // omitted when unknown — not plotted
  longitude?: number;
  website?: string;
  logo?: string;
  founders?: string;
  foundedYear?: number;
}
```

- Same Mongoose `id: false` / `timestamps` / `versionKey: false` / unique `id` as Company.
- `toBengaluruListing()` maps lean docs; `logo` = stored logo or `logoFor(website)`.
- `listingToMapCompany()` returns a `Company` only when both coordinates are finite. VC industry on the map is `VC` or `VC · {industry}`. Description falls back to tagline.
- Directory shows every listing; map shows the subset with coordinates. Live counts are whatever is in Atlas (import snapshot historically ~1k listings, hundreds mappable).

### DbConnect (`src/lib/mongodb.ts`)

1. If module `isConnected`, return.
2. `configureDns()`: if `MONGODB_DNS_SERVERS` set, use those; else if Node DNS is `127.0.0.1` / `::1`, switch to `1.1.1.1` and `8.8.8.8` (Atlas `mongodb+srv` SRV).
3. `mongoose.connect(uri)`.

This is a module flag, not a `globalThis` cache. Hot reload may reconnect.

## Map behavior (`StartupMap`)

Props: `companies: Company[]`, optional `center`, `zoom`, `minZoom`, `title`, `mappedAcross`, `directoryHref`. Hyderabad defaults (`HYDERABAD_CENTER`, zoom `11.15`, `minZoom: 9`, title “Companies in Hyderabad”, `directoryHref=/companies`). Bengaluru page passes `BENGALURU_CENTER` `[77.5946, 12.9716]`, zoom `10.8`, `minZoom: 8`. Effect depends on `companies` and viewport. Teardown: `map.remove()`, unmount popup roots, remove HTML markers.

Worker: `maplibregl.setWorkerUrl("/maplibre/maplibre-gl-worker.mjs")`.

### Viewport

- Wrapper: `relative h-dvh overflow-hidden`; canvas `absolute inset-0`
- Bottom overlay row (`MapBottomBar`): `absolute inset-x-4 bottom-4`, `flex items-end` — Portfolio left, ad tray center, legal links right. Fullscreen still targets the canvas only. `directoryHref` is forwarded to `MapLegalLinks`.
- Center `[78.4867, 17.385]`, zoom `11.15`, `minZoom: 9`, `maxZoom: 18` (Hyderabad). Bengaluru map: center `[77.5946, 12.9716]`, zoom `10.8`, `minZoom: 8`.
- Style: `https://tiles.openfreemap.org/styles/positron`
- Controls: navigation + fullscreen (top-right), compact attribution
- Title overlay: “Startup discovery” / title / `{n} companies mapped across {mappedAcross}`

### Clustering (MapLibre-native, not JS)

Source `companies`: GeoJSON, `cluster: true`, `clusterRadius: 56`, `clusterMaxZoom: 16`. Coordinates `[longitude, latitude]`. Properties = company object (`id` required). Same source/layer IDs on both city maps.

| Layer | Type | Filter | Role |
| --- | --- | --- | --- |
| `clusters-glow` | circle | `has point_count` | Halo |
| `clusters` | circle | `has point_count` | Disc |
| `cluster-count` | symbol | `has point_count` | Count (`Noto Sans Bold`) |
| `company-points` | circle | `! has point_count` | Hit target under logos |

| Count | Color | Inner r | Glow r |
| --- | --- | --- | --- |
| 2–10 | `#7cb342` | 18 | 28 |
| 11–50 | `#c6b93a` | 24 | 38 |
| 51+ | `#f08a24` | 32 | 50 |

Cluster click → `getClusterExpansionZoom` → `easeTo` ~650ms. Pointer cursor on clusters and points.

### Markers and popups

Unclustered points: HTML `maplibregl.Marker` pool, synced on `render` via `querySourceFeatures` (dedupe by `id`). 46px white disc; logo or first letter.

Click marker or `company-points` → `maplibregl.Popup` + React `createRoot`(`CompanyPopup`): logo, name, industry · city, description, Visit Website.

## Chrome and SEO

- Root layout is **scrollable** (`min-h-dvh`). Map pages themselves clip overflow.
- `CookieNotice`: bottom-left, offset by `--map-ad-tray-offset` while the tray is open; `localStorage` `hyd-map-cookie-notice` = `dismissed`. Essential storage plus disclosure of Analytics / possible AdSense; not a CMP.
- Metadata: title template `%s · Hyderabad Companies Map`, `en_IN` Open Graph, `index/follow`. Bengaluru map title: “Bengaluru map”; directory: “Bengaluru directory”.

## AdSense (gated)

Tray UI is always on `/` and `/bengaluru` until dismissed (`sessionStorage` `hyd-map-ad-tray`). Five ~28px-tall placeholders + one matching horizontal bar, overlaid at the bottom center of the map. Live `<ins>` only for slot IDs that are set.

`adsbygoogle.js` mounts **from the tray**, not the root layout, and only when `isAdsenseEnabled()` is true: production + `ca-pub-` client + at least one slot. No Auto ads. Do not `display: none` filled units; close **unmounts** the tray.

`GET /ads.txt` returns Google’s seller line when the client env is set; otherwise 404. Do not commit a static `public/ads.txt`.

Do not enable live ads until HTTPS domain, real contact email, and Google approval. Operator still must set `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_CONTACT_EMAIL`, then AdSense client/slots.

## Out of scope

- Auth, search/filters, admin, jobs badges, payments
- Auto ads / house-priced inventory / AdSense on content pages
- Prisma / Supabase
- Local `companies.ts` seed file
- Docker for Mongo (Atlas URI only)
- Runtime scrape of bangalorestartupmap.com; `GET /api/bengaluru`; mixing collections

## Caveats

- Namespace-import MapLibre; default export is undefined.
- Cluster labels need OpenFreeMap glyphs (`Noto Sans Bold`).
- Favicons fail → letter pin. Many docs have no `website`.
- `querySourceFeatures` can duplicate points; key markers by `id`.
- `next.config.ts`: `turbopack.root` = this app; webpack `noParse` for `maplibre-gl` dist.
- Edit listings in MongoDB only.
- Do not add a `(content)/bengaluru` page: App Router treats it as a second `/bengaluru` next to `src/app/bengaluru`.
- Bengaluru pins skip rows without coordinates; the directory still lists them.
