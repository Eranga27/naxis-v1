import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

// Open Graph / Twitter share image, shared by every page's
// opengraph-image.tsx: the ink ground and brand light of the hero, the
// NAXIS wordmark, the page's title in Bebas Neue and the client's
// sign-off.
export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

const read = (path: string) => readFile(join(process.cwd(), path));

export async function renderOgImage({
  eyebrow,
  title,
}: {
  eyebrow: string;
  title: string;
}) {
  const [bebas, inter, logo] = await Promise.all([
    read("src/assets/fonts/BebasNeue-Regular.woff"),
    read("src/assets/fonts/Inter-SemiBold.woff"),
    read("public/logos/naxis-wordmark.png"),
  ]);
  const logoSrc = `data:image/png;base64,${logo.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 72px",
          background: "#100d09",
          backgroundImage:
            "radial-gradient(ellipse 70% 70% at 0% 100%, rgba(255,201,74,0.22), transparent 70%), radial-gradient(ellipse 55% 70% at 100% 0%, rgba(47,208,138,0.18), transparent 70%)",
          color: "#f4efe4",
          fontFamily: "Inter",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logoSrc} alt="" width={110} height={90} style={{ objectFit: "contain" }} />
          <div style={{ display: "flex", fontSize: 22, letterSpacing: 6, color: "rgba(244,239,228,0.6)" }}>
            {eyebrow.toUpperCase()}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            fontFamily: "Bebas Neue",
            fontSize: title.length > 34 ? 104 : 132,
            lineHeight: 0.95,
            textTransform: "uppercase",
            maxWidth: 1000,
          }}
        >
          {title}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <div style={{ display: "flex", width: 90, height: 3, background: "linear-gradient(90deg, #ffc94a, #2fd08a)" }} />
          <div style={{ display: "flex", fontSize: 22, letterSpacing: 7, color: "#ffc94a" }}>NAXIS AUSTRALIA</div>
          <div style={{ display: "flex", fontSize: 18, letterSpacing: 4, color: "rgba(244,239,228,0.55)" }}>
            DELIVERING EXCELLENCE THROUGH EXPERIENCE.
          </div>
        </div>
      </div>
    ),
    {
      ...OG_SIZE,
      fonts: [
        { name: "Bebas Neue", data: bebas, style: "normal", weight: 400 },
        { name: "Inter", data: inter, style: "normal", weight: 600 },
      ],
    }
  );
}
