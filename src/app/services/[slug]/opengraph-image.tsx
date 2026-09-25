import { SERVICES, getService } from "@/content/services";
import { OG_CONTENT_TYPE, OG_SIZE, renderOgImage } from "@/lib/og";

export const alt = "NAXIS Australia service";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

// Generated at build time for each service (as the pages are), so the
// fonts are read from disk during the build rather than by a function.
export function generateStaticParams() {
  return SERVICES.map((service) => ({ slug: service.slug }));
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const service = getService(slug);
  return renderOgImage({
    eyebrow: service ? `Services · ${service.number}` : "Services",
    title: service?.title ?? "Services",
  });
}
