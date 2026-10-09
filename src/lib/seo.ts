export const SITE_URL = "https://ascent.withcloud.io";
// Absolute: LinkedIn, WhatsApp and Slack ignore a relative og:image.
export const OG_IMAGE = `${SITE_URL}/og-image.png`;
/** A per-page card rendered by `bun run og:images` into public/og/. */
export const shareImage = (file: string) => `${SITE_URL}/og/${file}`;
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
  image = OG_IMAGE,
  schema = [],
}: {
  title: string;
  description: string;
  path: string;
  /** Absolute URL; LinkedIn, WhatsApp and Slack ignore a relative og:image. */
  image?: string | undefined;
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
      { property: "og:image", content: image },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: image },
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
