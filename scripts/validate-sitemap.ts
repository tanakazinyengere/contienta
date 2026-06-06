// CI guard: compares public/sitemap.xml against the route manifest and fails
// the build if the two drift. Run via `npm run validate:sitemap`.

import { readFileSync } from "fs";
import { resolve } from "path";
import { publicRoutes, authRoutes } from "../src/lib/routeManifest";

const xml = readFileSync(resolve("public/sitemap.xml"), "utf8");
const robots = readFileSync(resolve("public/robots.txt"), "utf8");

const locs = Array.from(xml.matchAll(/<loc>([^<]+)<\/loc>/g)).map((m) => {
  try { return new URL(m[1]).pathname.replace(/\/$/, "") || "/"; } catch { return m[1]; }
});
const expected = publicRoutes.map((r) => r.path);

const missing = expected.filter((p) => !locs.includes(p));
const extra = locs.filter((p) => !expected.includes(p));

// Auth routes must NOT appear in public sitemap
const leakedAuth = authRoutes.filter((r) => locs.includes(r.path)).map((r) => r.path);

// robots.txt must Disallow every auth route
const missingDisallow = authRoutes.filter(
  (r) => !new RegExp(`Disallow:\\s*${r.path}(\\s|$)`).test(robots)
).map((r) => r.path);

const problems: string[] = [];
if (missing.length) problems.push(`Missing in sitemap.xml: ${missing.join(", ")}`);
if (extra.length) problems.push(`Unexpected in sitemap.xml: ${extra.join(", ")}`);
if (leakedAuth.length) problems.push(`Auth-gated routes leaked into public sitemap: ${leakedAuth.join(", ")}`);
if (missingDisallow.length) problems.push(`robots.txt missing Disallow for: ${missingDisallow.join(", ")}`);

if (problems.length) {
  console.error("❌ Sitemap validation failed:\n - " + problems.join("\n - "));
  process.exit(1);
}
console.log(`✅ Sitemap valid · ${expected.length} public routes · ${authRoutes.length} auth routes excluded`);
