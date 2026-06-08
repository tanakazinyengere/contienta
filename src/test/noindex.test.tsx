import { describe, it, expect, beforeEach } from "vitest";
import { render, waitFor } from "@testing-library/react";
import { HelmetProvider } from "react-helmet-async";
import NoIndex from "@/components/NoIndex";
import { isAuthGatedPath, authRoutes, publicRoutes } from "@/lib/routeManifest";

describe("NoIndex + routeManifest", () => {
  beforeEach(() => { document.head.innerHTML = ""; });

  it("renders robots=noindex,nofollow and googlebot=noindex,nofollow", async () => {
    render(<HelmetProvider><NoIndex /></HelmetProvider>);
    await waitFor(() => {
      const robots = document.head.querySelector('meta[name="robots"]') as HTMLMetaElement | null;
      const gb = document.head.querySelector('meta[name="googlebot"]') as HTMLMetaElement | null;
      expect(robots?.content).toBe("noindex, nofollow");
      expect(gb?.content).toBe("noindex, nofollow");
    });
  });

  it("isAuthGatedPath matches static auth routes", () => {
    expect(isAuthGatedPath("/app")).toBe(true);
    expect(isAuthGatedPath("/onboarding")).toBe(true);
    expect(isAuthGatedPath("/admin")).toBe(true);
  });

  it("isAuthGatedPath matches dynamic auth routes", () => {
    expect(isAuthGatedPath("/app/messages")).toBe(true);
    expect(isAuthGatedPath("/app/reef?foo=1")).toBe(true);
    expect(isAuthGatedPath("/admin/users")).toBe(true);
  });

  it("isAuthGatedPath rejects public routes", () => {
    for (const r of publicRoutes) expect(isAuthGatedPath(r.path)).toBe(false);
  });

  it("no auth route is also listed as public", () => {
    const pub = new Set(publicRoutes.map((r) => r.path));
    for (const a of authRoutes) expect(pub.has(a.path)).toBe(false);
  });
});
