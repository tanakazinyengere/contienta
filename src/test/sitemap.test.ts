import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import { publicRoutes, authRoutes, authDisallowPrefixes } from "@/lib/routeManifest";

describe("sitemap & robots integrity", () => {
  const xml = existsSync(resolve("public/sitemap.xml")) ? readFileSync(resolve("public/sitemap.xml"), "utf8") : "";
  const robots = existsSync(resolve("public/robots.txt")) ? readFileSync(resolve("public/robots.txt"), "utf8") : "";

  it("public sitemap contains all public routes", () => {
    for (const r of publicRoutes.filter((x) => !x.path.includes(":"))) {
      expect(xml).toContain(`${r.path === "/" ? "/" : r.path}<`);
    }
  });

  it("public sitemap excludes every auth route", () => {
    for (const r of authRoutes) {
      expect(xml).not.toMatch(new RegExp(`<loc>[^<]*${r.path}</loc>`));
    }
  });

  it("no duplicate <loc> entries", () => {
    const locs = Array.from(xml.matchAll(/<loc>([^<]+)<\/loc>/g)).map((m) => m[1]);
    expect(new Set(locs).size).toBe(locs.length);
  });

  it("no <loc> contains a query string", () => {
    const locs = Array.from(xml.matchAll(/<loc>([^<]+)<\/loc>/g)).map((m) => m[1]);
    for (const l of locs) expect(l).not.toMatch(/[?#]/);
  });

  it("robots.txt Disallows every auth prefix", () => {
    for (const p of authDisallowPrefixes) {
      expect(robots).toMatch(new RegExp(`Disallow:\\s*${p.replace(/[/\-\\^$*+?.()|[\]{}]/g, "\\$&")}`));
    }
  });

  it("robots.txt references only the public sitemap", () => {
    expect(robots).toMatch(/Sitemap:\s*\S+\/sitemap\.xml/);
    expect(robots).not.toMatch(/sitemap-internal\.xml/);
  });
});
