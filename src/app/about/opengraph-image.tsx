import { OG_CONTENT_TYPE, OG_SIZE, renderOgImage } from "@/lib/og";

export const alt = "About NAXIS Australia — From Concept to Creation. Factory to You.";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return renderOgImage({ eyebrow: "About NAXIS Australia", title: "From concept to creation. Factory to you." });
}
