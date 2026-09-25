import { OG_CONTENT_TYPE, OG_SIZE, renderOgImage } from "@/lib/og";

export const alt = "MOQ? Let's Talk. — Start a project with NAXIS Australia";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return renderOgImage({ eyebrow: "Start a project", title: "MOQ? Let's talk." });
}
