import { OG_CONTENT_TYPE, OG_SIZE, renderOgImage } from "@/lib/og";

export const alt = "NAXIS Australia services — the complete journey, managed.";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return renderOgImage({ eyebrow: "What we do", title: "The complete journey, managed." });
}
