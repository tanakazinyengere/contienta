// CI guard: compares public/sitemap.xml against the route manifest and emits
// a structured mismatch report. Fails the build on any drift.

import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { resolve } from "path";
import { publicRoutes, authRoutes, authDisallowPrefixes } from "../src/lib/routeManifest";

const xml = readFileSync(resolve("public/sitemap.xml"), "utf8");
const robots = readFileSync(resolve("public/robots.txt"), "utf8");

const locs = Array.from(xml.matchAll(/<loc>([^<]+)<\/loc>/g)).map((m) => {
  try { return new URL(m[1]).pathname.replace(/\/$/, "") || "/"; } catch { return m[1]; }
});

const expected = publicRoutes.filter((r) => !r.path.includes(":")).map((r) => r.path);

// Dedup check
const dupes = locs.filter((p, i) => locs.indexOf(p) !== i);

const missing = expected.filter((p) => !locs.includes(p));
const extra = locs.filter((p) => !expected.includes(p));
const leakedAuth = authRoutes.filter((r) => locs.includes(r.path)).map((r) => r.path);
const missingDisallow = authDisallowPrefixes.filter(
  (p) => !new RegExp(`Disallow:\\s*${p.replace(/[/\-\\^$*+?.()|[\]{}]/g, "\\$&")}(\\s|$)`).test(robots)
);
const hasSitemapLine = /Sitemap:\s*\S+\/sitemap\.xml/.test(robots);

interface Mismatch { kind: string; route?: string; reason: string }
const mismatches: Mismatch[] = [];
for (const r of missing) mismatches.push({ kind: "missing_sitemap_entry", route: r, reason: "Route declared public in manifest but absent from sitemap.xml" });
for (const r of extra) mismatches.push({ kind: "unexpected_public_inclusion", route: r, reason: "URL is in sitemap.xml but not declared public in manifest" });
for (const r of leakedAuth) mismatches.push({ kind: "auth_route_leaked", route: r, reason: "Auth-gated route appears in public sitemap" });
for (const p of missingDisallow) mismatches.push({ kind: "missing_robots_disallow", route: p, reason: "Auth prefix not Disallowed in robots.txt" });
for (const d of [...new Set(dupes)]) mismatches.push({ kind: "duplicate_url", route: d, reason: "URL listed more than once in sitemap.xml" });
if (!hasSitemapLine) mismatches.push({ kind: "missing_sitemap_reference", reason: "robots.txt does not reference sitemap.xml" });

const report = {
  ok: mismatches.length === 0,
  generated_at: new Date().toISOString(),
  counts: {
    public_expected: expected.length,
    public_in_sitemap: locs.length,
    auth_disallow_prefixes: authDisallowPrefixes.length,
    mismatches: mismatches.length,
  },
  mismatches,
};

mkdirSync(resolve("public/.reports"), { recursive: true });
writeFileSync(resolve("public/.reports/sitemap-validation.json"), JSON.stringify(report, null, 2));

if (!report.ok) {
  console.error(`❌ Sitemap validation failed (${mismatches.length} mismatches):`);
  for (const m of mismatches) console.error(`  - [${m.kind}] ${m.route ?? ""} — ${m.reason}`);
  console.error(`Full report → public/.reports/sitemap-validation.json`);
  process.exit(1);
}
console.log(`✅ Sitemap valid · ${expected.length} public routes · ${authDisallowPrefixes.length} auth prefixes blocked`);
