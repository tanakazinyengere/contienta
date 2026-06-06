// Runs before `vite dev` and `vite build`. Writes:
//   public/sitemap.xml          — public, indexable routes only
//   public/sitemap-internal.xml — auth-gated routes (noindex, for ops/reference)
//   public/robots.txt           — references the public sitemap only

import { writeFileSync, readFileSync, existsSync } from "fs";
import { resolve } from "path";
import { routeManifest, publicRoutes, authRoutes } from "../src/lib/routeManifest";

const BASE_URL = "https://clippedin.lovable.app";

function renderUrlset(entries: typeof routeManifest) {
  const urls = entries.map((e) =>
    [
      `  <url>`,
      `    <loc>${BASE_URL}${e.path}</loc>`,
      e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
      e.priority ? `    <priority>${e.priority}</priority>` : null,
      `  </url>`,
    ]
      .filter(Boolean)
      .join("\n")
  );
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

// Keep robots.txt in sync: Allow public, Disallow every auth route, reference public sitemap only.
const robotsPath = resolve("public/robots.txt");
const disallow = authRoutes.map((r) => `Disallow: ${r.path}`).join("\n");
const robots = `User-agent: *\nAllow: /\n${disallow}\n\nSitemap: ${BASE_URL}/sitemap.xml\n`;
writeFileSync(robotsPath, robots);

console.log(
  `sitemap.xml: ${publicRoutes.length} public · sitemap-internal.xml: ${authRoutes.length} auth · robots.txt synced`
);
