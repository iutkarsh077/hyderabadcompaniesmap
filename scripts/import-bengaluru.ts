import { readFile } from "node:fs/promises";
import path from "node:path";
import { logoFor } from "../src/types/company";
import DbConnect from "../src/lib/mongodb";
import { BengaluruListingModel } from "../src/models/BengaluruListing";
import type { BengaluruKind } from "../src/types/bengaluru-listing";

type SourceRow = {
  name?: unknown;
  slug?: unknown;
  kind?: unknown;
  tagline?: unknown;
  description?: unknown;
  stage?: unknown;
  sector?: unknown;
  area?: unknown;
  hsr_location?: unknown;
  lat?: unknown;
  lng?: unknown;
  logo?: unknown;
  website?: unknown;
  founders?: unknown;
  founded_year?: unknown;
};

function isPresent(value: unknown): value is string | number {
  if (value === null || value === undefined) return false;
  if (value === "$undefined") return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (typeof value === "number") return Number.isFinite(value);
  return false;
}

function asString(value: unknown): string | undefined {
  if (!isPresent(value)) return undefined;
  return String(value).trim();
}

function asNumber(value: unknown): number | undefined {
  if (!isPresent(value)) return undefined;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : undefined;
}

function mapRow(row: SourceRow) {
  const name = asString(row.name);
  const slug = asString(row.slug);
  const kind = asString(row.kind);
  if (!name || !slug) return null;
  if (kind !== "startup" && kind !== "vc") return null;

  const tagline = asString(row.tagline);
  const description = asString(row.description) || tagline || "";
  const website = asString(row.website);
  const storedLogo = asString(row.logo);
  const logo = storedLogo || logoFor(website);
  const latitude = asNumber(row.lat);
  const longitude = asNumber(row.lng);
  const foundedYear = asNumber(row.founded_year);
  const founders = typeof row.founders === "string" ? asString(row.founders) : undefined;

  return {
    id: slug,
    name,
    kind: kind as BengaluruKind,
    description,
    industry: asString(row.sector) || "Other",
    city: asString(row.area) || "Bengaluru",
    ...(tagline ? { tagline } : {}),
    ...(asString(row.stage) ? { stage: asString(row.stage) } : {}),
    ...(asString(row.hsr_location) ? { hsrLocation: asString(row.hsr_location) } : {}),
    ...(latitude !== undefined ? { latitude } : {}),
    ...(longitude !== undefined ? { longitude } : {}),
    ...(website ? { website } : {}),
    ...(logo ? { logo } : {}),
    ...(founders ? { founders } : {}),
    ...(foundedYear !== undefined ? { foundedYear } : {}),
  };
}

async function main() {
  const sourcePath = path.join(process.cwd(), "data", "bengaluru-source.json");
  let raw: unknown;
  try {
    raw = JSON.parse(await readFile(sourcePath, "utf8"));
  } catch {
    console.error(
      `Missing or invalid snapshot at ${sourcePath}. Place an array of source listings there (gitignored).`,
    );
    process.exit(1);
  }

  if (!Array.isArray(raw)) {
    console.error("bengaluru-source.json must be a JSON array.");
    process.exit(1);
  }

  const docs = [];
  const seen = new Set<string>();
  for (const row of raw) {
    if (!row || typeof row !== "object") continue;
    const mapped = mapRow(row as SourceRow);
    if (!mapped || seen.has(mapped.id)) continue;
    seen.add(mapped.id);
    docs.push(mapped);
  }

  if (docs.length === 0) {
    console.error("No valid listings in snapshot.");
    process.exit(1);
  }

  await DbConnect();

  const ops = docs.map((doc) => ({
    updateOne: {
      filter: { id: doc.id },
      update: { $set: doc },
      upsert: true,
    },
  }));

  const result = await BengaluruListingModel.bulkWrite(ops, { ordered: false });
  console.log(
    `Upserted Bengaluru listings: matched=${result.matchedCount} upserted=${result.upsertedCount} modified=${result.modifiedCount} total=${docs.length}`,
  );
  process.exit(0);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
