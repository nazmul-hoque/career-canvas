import { describe, expect, test } from "bun:test";
import { canonicalUrl, seoHead, SITE_URL } from "../src/lib/seo";
import { renderSitemap, sitemapPaths } from "../src/lib/sitemap";

describe("public search metadata", () => {
  test("canonical URLs drop campaign queries, fragments and trailing slashes", () => {
    expect(canonicalUrl("/learn/?utm_source=email#courses")).toBe(`${SITE_URL}/learn`);
    expect(canonicalUrl("/")).toBe(`${SITE_URL}/`);
  });
  test("structured data cannot close its script element", () => {
    const head = seoHead({
      path: "/",
      title: "Ascent",
      description: "Learn",
      schema: [{ name: "</script><script>alert(1)</script>" }],
    });
    expect(head.scripts[0].children).not.toContain("<");
    expect(JSON.parse(head.scripts[0].children).name).toBe("</script><script>alert(1)</script>");
    expect(head.links[0].href).toBe(`${SITE_URL}/`);
    expect(head.meta).toContainEqual({
      name: "robots",
      content: "index, follow, max-image-preview:large",
    });
  });
  test("sitemap includes unique public pages and excludes personal learning routes", () => {
    const paths = sitemapPaths();
    expect(new Set(paths).size).toBe(paths.length);
    expect(paths).toContain("/learn");
    expect(paths.some((path) => path.startsWith("/courses/"))).toBe(true);
    expect(
      paths.some((path) => /^\/(auth|dashboard|profile|review|certificates)(\/|$)/.test(path)),
    ).toBe(false);
    expect(paths.some((path) => path.startsWith("/learn/"))).toBe(false);
    expect(renderSitemap().match(/<loc>/g)?.length).toBe(paths.length);
    expect(renderSitemap()).not.toContain("lovable");
  });
});
