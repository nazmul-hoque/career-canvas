export const SITE_URL = "https://ascent.withcloud.io";
export const SITE_DESCRIPTION =
  "Learn coding, data, design and AI with interactive courses, career roadmaps, hands-on challenges and portfolio projects on Ascent.";

export function canonicalUrl(path: string) {
  const pathname = new URL(path, SITE_URL).pathname.replace(/\/+$/, "") || "/";
  return `${SITE_URL}${pathname}`;
}

export function seoHead({
  title,
  description,
  path,
  schema = [],
}: {
  title: string;
  description: string;
  path: string;
  schema?: Record<string, unknown>[];
}) {
  const url = canonicalUrl(path);
  return {
    meta: [
      { title },
      { name: "description", content: description },
      { name: "robots", content: "index, follow, max-image-preview:large" },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "Ascent" },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:url", content: url },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
    ],
    links: [{ rel: "canonical", href: url }],
    scripts: schema.map((item) => ({
      type: "application/ld+json",
      children: JSON.stringify({ "@context": "https://schema.org", ...item }).replace(
        /</g,
        "\\u003c",
      ),
    })),
  };
}

export function breadcrumbs(items: { name: string; path: string }[]) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: canonicalUrl(item.path),
    })),
  };
}
