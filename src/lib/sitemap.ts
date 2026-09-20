import { careerPaths, courses } from "../content/curriculum";
import { projects } from "../content/projects";
import { canonicalUrl } from "./seo";

// Only public, server-rendered discovery pages belong in search results.
export function sitemapPaths() {
  return [
    "/",
    "/paths",
    "/learn",
    "/pricing",
    "/projects",
    ...careerPaths.map((path) => `/paths/${path.id}`),
    ...courses.map((course) => `/courses/${course.id}`),
    ...projects.map((project) => `/projects/${project.id}`),
  ];
}

export function renderSitemap() {
  const escapeXml = (value: string) =>
    value.replace(
      /[<>&"']/g,
      (char) =>
        ({
          "<": "&lt;",
          ">": "&gt;",
          "&": "&amp;",
          '"': "&quot;",
          "'": "&apos;",
        })[char]!,
    );
  return (
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    sitemapPaths()
      .map((path) => `  <url><loc>${escapeXml(canonicalUrl(path))}</loc></url>`)
      .join("\n") +
    "\n</urlset>\n"
  );
}
