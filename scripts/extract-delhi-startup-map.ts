import { writeFileSync } from "node:fs";
import path from "node:path";
import { logoFor } from "../src/types/company";

const SOURCE_URL = "https://www.delhistartupmap.com/";
const OUT_PATH = path.join(process.cwd(), "data", "gurugram-noida--delhi-side-source.json");

type SourceCompany = {
  id?: string;
  slug?: string;
  name?: string;
  type?: string;
  website?: string | null;
  description?: string | null;
  sector?: string | null;
  city?: string | null;
  area?: string | null;
  lat?: number | null;
  lng?: number | null;
  logo_url?: string | null;
};

function unescapeNextPayload(chunk: string): string {
  // Chunks inside self.__next_f.push([1,"..."]) are JS string literals.
  try {
    return JSON.parse(`"${chunk}"`);
  } catch {
    return chunk
      .replace(/\\"/g, '"')
      .replace(/\\n/g, "\n")
      .replace(/\\u0026/g, "&")
      .replace(/\\\\/g, "\\");
  }
}

function extractCompaniesArrayText(html: string): string {
  const pushRe = /self\.__next_f\.push\(\[1,"([\s\S]*?)"\]\)/g;
  let match: RegExpExecArray | null;
  const parts: string[] = [];

  while ((match = pushRe.exec(html)) !== null) {
    parts.push(unescapeNextPayload(match[1]));
  }

  const combined = parts.length > 0 ? parts.join("") : html;
  const markers = ['"companies":[', "companies:["];

  for (const marker of markers) {
    const start = combined.indexOf(marker);
    if (start < 0) continue;
    const arrayStart = start + marker.indexOf("[");
    let depth = 0;
    let inStr = false;
    let esc = false;

    for (let i = arrayStart; i < combined.length; i++) {
      const c = combined[i];
      if (inStr) {
        if (esc) {
          esc = false;
          continue;
        }
        if (c === "\\") {
          esc = true;
          continue;
        }
        if (c === '"') inStr = false;
        continue;
      }
      if (c === '"') {
        inStr = true;
        continue;
      }
      if (c === "[") depth++;
      else if (c === "]") {
        depth--;
        if (depth === 0) return combined.slice(arrayStart, i + 1);
      }
    }
  }

  throw new Error("Could not find companies array in page HTML");
}

function mapRow(row: SourceCompany) {
  const slug = row.slug?.trim();
  const name = row.name?.trim();
  if (!slug || !name) return null;

  const latitude = typeof row.lat === "number" && Number.isFinite(row.lat) ? row.lat : undefined;
  const longitude = typeof row.lng === "number" && Number.isFinite(row.lng) ? row.lng : undefined;
  if (latitude === undefined || longitude === undefined) return null;

  const website = row.website?.trim() || undefined;
  const storedLogo = row.logo_url?.trim() || undefined;
  const logo = storedLogo || logoFor(website);
  const city = row.city?.trim() || row.area?.trim() || "Gurugram";
  const industry = row.sector?.trim() || "Other";
  const description = row.description?.trim() || "";

  return {
    id: slug,
    name,
    description,
    industry,
    city,
    latitude,
    longitude,
    ...(website ? { website } : {}),
    ...(logo ? { logo } : {}),
  };
}

async function main() {
  const res = await fetch(SOURCE_URL, {
    headers: {
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      accept: "text/html,application/xhtml+xml",
    },
  });

  if (!res.ok) {
    console.error(`Fetch failed: ${res.status} ${res.statusText}`);
    process.exit(1);
  }

  const html = await res.text();
  const arrayText = extractCompaniesArrayText(html);
  const raw = JSON.parse(arrayText) as SourceCompany[];
  if (!Array.isArray(raw)) throw new Error("companies payload is not an array");

  const seen = new Set<string>();
  const docs = [];
  let skipped = 0;

  for (const row of raw) {
    const mapped = mapRow(row);
    if (!mapped) {
      skipped++;
      continue;
    }
    if (seen.has(mapped.id)) {
      skipped++;
      continue;
    }
    seen.add(mapped.id);
    docs.push(mapped);
  }

  writeFileSync(OUT_PATH, `${JSON.stringify(docs, null, 2)}\n`);

  const cities: Record<string, number> = {};
  for (const d of docs) cities[d.city] = (cities[d.city] || 0) + 1;

  console.log(
    JSON.stringify(
      {
        source: SOURCE_URL,
        rawCount: raw.length,
        saved: docs.length,
        skipped,
        cities,
        out: OUT_PATH,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
