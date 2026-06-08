// Runs before `vite dev` and `vite build`. Writes:
//   public/sitemap.xml          — public, indexable routes only
//   public/sitemap-internal.xml — auth-gated routes (noindex, for ops/reference)
//   public/robots.txt           — references the public sitemap only
//
// Hardening:
//  - Dedupes URLs by canonical pathname
//  - Strips query strings + fragments
//  - Emits a single consistent canonical loc per route across environments

import { writeFileSync } from "fs";
import { resolve } from "path";
import { routeManifest, publicRoutes, authRoutes, authDisallowPrefixes } from "../src/lib/routeManifest";

const BASE_URL = (process.env.SITE_URL || "https://clippedin.lovable.app").replace(/\/$/, "");

function canonicalize(path: string): string {
  // Strip query/fragment, collapse trailing slash (except root)
  const cleaned = path.split("?")[0].split("#")[0];
  if (cleaned === "/" || cleaned === "") return "/";
  return cleaned.replace(/\/+$/, "");
}

function renderUrlset(entries: typeof routeManifest) {
  const seen = new Set<string>();
  const urls: string[] = [];
  for (const e of entries) {
    // Skip dynamic patterns from sitemap output — we can't emit :param URLs
    if (e.path.includes(":")) continue;
    const canon = canonicalize(e.path);
    if (seen.has(canon)) continue;
    seen.add(canon);
    urls.push([
      `  <url>`,
      `    <loc>${BASE_URL}${canon === "/" ? "/" : canon}</loc>`,
      e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
      e.priority ? `    <priority>${e.priority}</priority>` : null,
      `  </url>`,
    ].filter(Boolean).join("\n"));
  }
  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
    ...urls,
    `</urlset>`,
    ``,
  ].join("\n");
}

writeFileSync(resolve("public/sitemap.xml"), renderUrlset(publicRoutes));
writeFileSync(
  resolve("public/sitemap-internal.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>\n<!-- Internal/auth-gated routes. NOT linked from robots.txt. Pages serve <meta name="robots" content="noindex"> at runtime. -->\n` +
    renderUrlset(authRoutes).replace(/^<\?xml.*\n/, "")
);

// robots.txt — Disallow every auth prefix (static + dynamic), reference public sitemap only.
const disallow = authDisallowPrefixes.map((p) => `Disallow: ${p}`).join("\n");
const robots = `User-agent: *\nAllow: /\n${disallow}\n\nSitemap: ${BASE_URL}/sitemap.xml\n`;
writeFileSync(resolve("public/robots.txt"), robots);

const publicCount = publicRoutes.filter((r) => !r.path.includes(":")).length;
const authCount = authRoutes.length;
console.log(`sitemap.xml: ${publicCount} public · sitemap-internal.xml: ${authCount} auth · robots.txt synced (${authDisallowPrefixes.length} Disallow prefixes)`);
