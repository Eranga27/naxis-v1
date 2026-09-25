// The site's canonical origin, for metadata, the sitemap and structured
// data. NEXT_PUBLIC_SITE_URL wins when set (e.g. once the client's own
// domain is live — [CONFIRM WITH CLIENT]); otherwise Vercel's production
// URL at build time, falling back to the current production deployment.
const vercelProduction = process.env.VERCEL_PROJECT_PRODUCTION_URL;

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ??
  (vercelProduction ? `https://${vercelProduction}` : "https://naxis-v1.vercel.app")
).replace(/\/$/, "");

export const SITE_NAME = "NAXIS Australia";

// The client's own positioning (About artboard, first paragraph).
export const SITE_DESCRIPTION =
  "NAXIS Australia is an Australian-based apparel product development, manufacturing and complete supply chain solutions company, supported by our own manufacturing facilities and a trusted global network of specialised partner factories.";

// Every public page, for the sitemap. Add each page as it lands.
export const SITE_PAGES = ["/", "/about", "/services", "/how-we-work", "/compliance", "/contact"];
