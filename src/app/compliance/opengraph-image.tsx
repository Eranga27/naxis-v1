import { OG_CONTENT_TYPE, OG_SIZE, renderOgImage } from "@/lib/og";

export const alt = "Compliance at NAXIS Australia — independently audited, responsibly made.";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return renderOgImage({ eyebrow: "Compliance", title: "Independently audited. Responsibly made." });
}
