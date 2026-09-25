import { OG_CONTENT_TYPE, OG_SIZE, renderOgImage } from "@/lib/og";

export const alt = "How NAXIS Australia works — in apparel production, every detail matters.";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return renderOgImage({ eyebrow: "How we work", title: "Every detail matters." });
}
