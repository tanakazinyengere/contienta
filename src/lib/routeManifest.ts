// Single source of truth for app routes. Used by:
//  - sitemap generator (public routes only)
//  - internal sitemap generator (auth-gated routes, noindex)
//  - sitemap CI validator
//  - robots.txt (auth-gated routes are Disallow'd)
//  - <NoIndex /> resolution at runtime for dynamic auth-gated routes

export type RouteVisibility = "public" | "auth" | "internal";

export interface RouteMeta {
  path: string;            // canonical path; may include :param for dynamic routes
  visibility: RouteVisibility;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
  // For dynamic auth routes, used so robots/internal sitemap can Disallow the parent prefix
  prefix?: string;
}

export const routeManifest: RouteMeta[] = [
  // Public, indexable
  { path: "/", visibility: "public", changefreq: "weekly", priority: "1.0" },
  { path: "/about", visibility: "public", changefreq: "monthly", priority: "0.8" },
  { path: "/pricing", visibility: "public", changefreq: "weekly", priority: "0.9" },
  { path: "/faqs", visibility: "public", changefreq: "monthly", priority: "0.7" },
  { path: "/contact", visibility: "public", changefreq: "monthly", priority: "0.6" },
  { path: "/login", visibility: "public", changefreq: "monthly", priority: "0.5" },
  { path: "/terms", visibility: "public", changefreq: "yearly", priority: "0.4" },
  { path: "/privacy", visibility: "public", changefreq: "yearly", priority: "0.4" },
  { path: "/cookies", visibility: "public", changefreq: "yearly", priority: "0.3" },
  { path: "/refunds", visibility: "public", changefreq: "yearly", priority: "0.3" },
  { path: "/dmca", visibility: "public", changefreq: "yearly", priority: "0.3" },
  { path: "/acceptable-use", visibility: "public", changefreq: "yearly", priority: "0.3" },

  // Auth-gated static
  { path: "/app", visibility: "auth" },
  { path: "/onboarding", visibility: "auth" },
  { path: "/admin", visibility: "auth" },

  // Auth-gated dynamic (prefix-based) — all child paths are noindex + Disallow'd
  { path: "/app/:tab", visibility: "auth", prefix: "/app/" },
  { path: "/admin/:section", visibility: "auth", prefix: "/admin/" },
];

export const publicRoutes = routeManifest.filter((r) => r.visibility === "public");
export const authRoutes = routeManifest.filter((r) => r.visibility === "auth");

// Distinct robots Disallow prefixes (static + dynamic prefixes), deduped.
export const authDisallowPrefixes = Array.from(new Set(
  authRoutes.flatMap((r) => r.prefix ? [r.prefix] : [r.path])
));

// Runtime helper: does this pathname belong to an auth-gated route?
export function isAuthGatedPath(pathname: string): boolean {
  const p = pathname.split("?")[0].split("#")[0].replace(/\/+$/, "") || "/";
  for (const r of authRoutes) {
    if (r.prefix && p.startsWith(r.prefix.replace(/\/$/, ""))) return true;
    if (!r.prefix && (p === r.path || p.startsWith(r.path + "/"))) return true;
  }
  return false;
}
