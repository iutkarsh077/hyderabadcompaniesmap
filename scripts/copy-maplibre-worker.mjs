import { copyFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "node_modules", "maplibre-gl", "dist");
const dest = join(root, "public", "maplibre");

mkdirSync(dest, { recursive: true });
copyFileSync(join(dist, "maplibre-gl-worker.mjs"), join(dest, "maplibre-gl-worker.mjs"));
copyFileSync(join(dist, "maplibre-gl-shared.mjs"), join(dest, "maplibre-gl-shared.mjs"));
