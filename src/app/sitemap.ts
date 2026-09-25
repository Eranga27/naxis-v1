import type { MetadataRoute } from "next";
import { SERVICES } from "@/content/services";
import { SITE_PAGES, SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = [...SITE_PAGES, ...SERVICES.map((s) => `/services/${s.slug}`)];
  return pages.map((path) => ({
    url: `${SITE_URL}${path === "/" ? "" : path}`,
    changeFrequency: "monthly",
    priority: path === "/" ? 1 : 0.8,
  }));
}
