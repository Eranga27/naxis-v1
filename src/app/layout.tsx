import type { Metadata, Viewport } from "next";
import { Poppins, Anton, Inter } from "next/font/google";
import SmoothScroll from "@/components/SmoothScroll";
import CustomCursor from "@/components/CustomCursor";
import ScrollProgress from "@/components/ScrollProgress";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["800", "900"],
  display: "swap",
});

// Tall, condensed, minimal-counter grotesk for the hero headline only —
// Poppins (kept for other display/UI uses) is too rounded/geometric to
// match the intended industrial-poster look.
// latin-ext carries the diacritics used by the preloader greetings
// ("Xin chào", "Nǐ hǎo") — without it those glyphs fall back mid-word.
const anton = Anton({
  variable: "--font-anton",
  subsets: ["latin", "latin-ext"],
  weight: "400",
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "NAXIS — Offshore Garment Manufacturing",
  description:
    "NAXIS is an offshore garment manufacturing service provider with operations across six countries.",
};

export const viewport: Viewport = {
  themeColor: "#100d09",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${poppins.variable} ${anton.variable} ${inter.variable} antialiased`}
    >
      <head>
        {/* Runs at parse time, before <body> paints, so a repeat visitor in
            the same session never sees a flash of the white intro veil. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(sessionStorage.getItem('naxis:intro-seen')==='done'){document.documentElement.classList.add('intro-seen')}}catch(e){}`,
          }}
        />
      </head>
      <body className="flex min-h-screen flex-col bg-ink text-cream font-body">
        <SmoothScroll />
        <CustomCursor />
        <ScrollProgress />
        {children}
      </body>
    </html>
  );
}
