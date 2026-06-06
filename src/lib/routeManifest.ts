// Single source of truth for app routes. Used by:
//  - sitemap generator (public routes only)
//  - internal sitemap generator (auth-gated routes, noindex)
//  - sitemap CI validator
//  - robots.txt (auth-gated routes are Disallow'd)

export type RouteVisibility = "public" | "auth" | "internal";

export interface RouteMeta {
  path: string;
  visibility: RouteVisibility;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

export const routeManifest: RouteMeta[] = [
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

  // Auth-gated — excluded from public sitemap/robots, included in internal sitemap
  { path: "/app", visibility: "auth" },
  { path: "/onboarding", visibility: "auth" },
  { path: "/admin", visibility: "auth" },
];

export const publicRoutes = routeManifest.filter((r) => r.visibility === "public");
export const authRoutes = routeManifest.filter((r) => r.visibility === "auth");
