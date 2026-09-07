# Project spec — Hyderabad Companies Map

This file is the **as-built** source of truth for agents and humans. Original map intent: `Context/Map.md`. Do not assume `src/data/companies.ts` exists; it was deleted. Runtime listings are **MongoDB only**.

## Purpose

Public discovery site for companies in **Hyderabad, Telangana, India**:

1. Interactive clustered MapLibre map (`/`)
2. Crawlable industry directory (`/companies`)
3. About, Privacy, Terms, Contact for AdSense *readiness* (ads are **not** live)

No auth, search, filters, jobs, admin, payments, or AdSense script.

## Stack

| Layer | Choice |
| --- | --- |
| App | Next.js **16.3.4** App Router (`hyderabad-map/` is the repo root) |
| UI | React **19.2.8** |
| Language | TypeScript |
| Map | MapLibre GL JS **6.7** only (`import * as maplibregl from "maplibre-gl"`) |
| Styles | Tailwind CSS v4; marker/popup CSS in `src/app/globals.css` |
| Database | MongoDB Atlas + Mongoose **9** |
| Runtime data | Collection `companies`, queried on `/`, `/companies`, `GET /api/companies` |

Fonts: Geist / Geist Mono. Site name: `Hyderabad Companies Map` (`src/lib/site.ts`).

## Architecture

```
Browser
  GET /  →  page.tsx (Server, force-dynamic)
              getCompanies() → DbConnect → CompanyModel.find().sort({ name: 1 })
              toCompany() → StartupMap companies={...}
  GET /companies → same getCompanies(), grouped by industry in HTML
  GET /api/companies → JSON array of Company
```

`StartupMap` / `CompanyPopup` are `'use client'`. MapLibre is created in `useEffect` (never on the server).

## How to run

```bash
npm run dev      # http://localhost:3000/
npm run build
npm run start
npm run lint
```

`postinstall` runs `scripts/copy-maplibre-worker.mjs` → `public/maplibre/maplibre-gl-worker.mjs` and `maplibre-gl-shared.mjs`.

`npm run seed` is **disabled** (`scripts/seed-companies.ts` prints an error and `process.exit(1)`). There is no local seed array.

### Environment (`.env`, gitignored)

`.env.local` must **not** override these. Templates: `.env.example`.

| Variable | Role |
| --- | --- |
| `MONGODB_URI` | Atlas connection string (required). Missing → `DbConnect` throws `"MONGODB_URI is missing"`. |
| `MONGODB_DNS_SERVERS` | Optional comma-separated DNS (e.g. `1.1.1.1,8.8.8.8`). |
| `NEXT_PUBLIC_SITE_URL` | Canonical URL, no trailing slash. Default `http://localhost:3000`. Used for `metadataBase`, Open Graph, sitemap, robots. |
| `NEXT_PUBLIC_CONTACT_EMAIL` | Shown on Contact, Privacy, footer. Empty → Contact page tells the operator to set it. |

## Routes

| Path | What it is |
| --- | --- |
| `/` | Full-viewport map. Failure UI: check `MONGODB_URI` / Atlas (does **not** mention seed). Overlays: title card (top-left), `MapLegalLinks` (bottom-right). |
| `/companies` | Directory grouped by industry; cards with name, city, description, Website. `force-dynamic`. |
| `/about` | Independent directory, how listings work, map tech, ads not enabled. |
| `/privacy` | Privacy Policy (last updated 6 September 2026): no accounts, server logs, essential localStorage, MongoDB / OpenFreeMap / Google favicons, future ads. |
| `/terms` | Terms of Use: informational listings, no scraping/abuse, no fake ad clicks. |
| `/contact` | Correction/removal requests; `mailto:` if email env is set. |
| `/sitemap.xml` | `/`, `/companies`, `/about`, `/privacy`, `/terms`, `/contact`. |
| `/robots.txt` | Allow `/`, disallow `/api/`, sitemap URL. |
| `GET /api/companies` | JSON companies or `500` `{ error }`. |

Content pages use route group `src/app/(content)/` with `SiteHeader` + `SiteFooter` (`max-w-5xl`). Map route does **not** use that layout.

Header nav: Map, Directory, About, Contact. Footer: About, Privacy, Terms, Contact, email.

## File map

```
src/app/layout.tsx                 metadata, CookieNotice, scrollable html/body
src/app/page.tsx                   getCompanies() → StartupMap
src/app/sitemap.ts
src/app/robots.ts
src/app/globals.css
src/app/api/companies/route.ts
src/app/(content)/layout.tsx
src/app/(content)/{about,privacy,terms,contact,companies}/page.tsx
src/components/map/StartupMap.tsx
src/components/map/CompanyPopup.tsx
src/components/map/MapLegalLinks.tsx   Directory, About, Privacy, Contact
src/components/site/SiteHeader.tsx
src/components/site/SiteFooter.tsx
src/components/site/CookieNotice.tsx   localStorage key hyd-map-cookie-notice
src/lib/site.ts
src/lib/mongodb.ts                 default export DbConnect
src/lib/companies.ts               getCompanies()
src/types/company.ts               Company + logoFor()
src/models/Company.ts              CompanyModel, toCompany(), collection "companies"
scripts/seed-companies.ts          disabled
scripts/copy-maplibre-worker.mjs
public/maplibre/
next.config.ts                     serverExternalPackages: ["mongoose"]; turbopack.root; webpack noParse maplibre-gl
Context/spec.md                    this file
Context/Map.md                     original brief
Context/Data.ts                    empty, not imported
```

**Do not import** `@/data/companies`. Types: `@/types/company`.

## Data model

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

### DbConnect (`src/lib/mongodb.ts`)

1. If module `isConnected`, return.
2. `configureDns()`: if `MONGODB_DNS_SERVERS` set, use those; else if Node DNS is `127.0.0.1` / `::1`, switch to `1.1.1.1` and `8.8.8.8` (Atlas `mongodb+srv` SRV).
3. `mongoose.connect(uri)`.

This is a module flag, not a `globalThis` cache. Hot reload may reconnect.

## Map behavior (`StartupMap`)

Props: `companies: Company[]`. Effect depends on `companies`. Teardown: `map.remove()`, unmount popup roots, remove HTML markers.

Worker: `maplibregl.setWorkerUrl("/maplibre/maplibre-gl-worker.mjs")`.

### Viewport

- Wrapper: `h-dvh overflow-hidden`
- Center `[78.4867, 17.385]`, zoom `11.15`, `minZoom: 9`, `maxZoom: 18`
- Style: `https://tiles.openfreemap.org/styles/positron`
- Controls: navigation + fullscreen (top-right), compact attribution
- Title overlay: “Startup discovery” / “Companies in Hyderabad” / `{n} companies mapped across Hyderabad`

### Clustering (MapLibre-native, not JS)

Source `companies`: GeoJSON, `cluster: true`, `clusterRadius: 56`, `clusterMaxZoom: 16`. Coordinates `[longitude, latitude]`. Properties = company object (`id` required).

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

- Root layout is **scrollable** (`min-h-dvh`). Map page itself clips overflow.
- `CookieNotice`: bottom-left; `localStorage` `hyd-map-cookie-notice` = `dismissed`. Essential only; not ads consent.
- Metadata: title template `%s · Hyderabad Companies Map`, `en_IN` Open Graph, `index/follow`.

## AdSense (not implemented)

Do not add `adsbygoogle.js` or `ads.txt` until HTTPS domain, real contact email, and Google approval.

Already in place for review: original copy pages, directory HTML, privacy/terms, robots + sitemap, third-party disclosure (Atlas, OpenFreeMap, Google favicons).

Operator still must: deploy HTTPS, set `NEXT_PUBLIC_SITE_URL` and `NEXT_PUBLIC_CONTACT_EMAIL`, then apply in AdSense.

## Out of scope

- Auth, search/filters, admin, jobs badges, payments
- Live AdSense / Auto ads / ads.txt
- Prisma / Supabase
- Local `companies.ts` seed file
- Docker for Mongo (Atlas URI only)

## Caveats

- Namespace-import MapLibre; default export is undefined.
- Cluster labels need OpenFreeMap glyphs (`Noto Sans Bold`).
- Favicons fail → letter pin. Many docs have no `website`.
- `querySourceFeatures` can duplicate points; key markers by `id`.
- `next.config.ts`: `turbopack.root` = this app; webpack `noParse` for `maplibre-gl` dist.
- Edit listings in MongoDB only.
