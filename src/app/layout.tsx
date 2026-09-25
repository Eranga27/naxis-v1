import type { Metadata, Viewport } from "next";
import {
  Bebas_Neue,
  Inter,
  Noto_Sans_Sinhala,
  Noto_Sans_Devanagari,
  Noto_Sans_Bengali,
  Source_Serif_4,
  Allura,
  Instrument_Serif,
} from "next/font/google";
import SmoothScroll from "@/components/SmoothScroll";
import RouteEffects from "@/components/RouteEffects";
import Nav from "@/components/Nav";
import CustomCursor from "@/components/CustomCursor";
import ScrollProgress from "@/components/ScrollProgress";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";
import "./globals.css";

// Tall, minimalist condensed sans for the hero headline only — thinner and
// more restrained than a poster-weight face, which reads as premium rather
// than shouty.
const bebasNeue = Bebas_Neue({
  variable: "--font-bebas-neue",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "latin-ext"],
  weight: ["300", "400", "500", "600"],
  display: "swap",
});

// Editorial serif for the sections that mirror the client's own artboards
// (About, MOQ, service pages). A stand-in until the client confirms the
// exact face used in their brand material. Variable, with the optical-size
// axis so large headlines get the tighter display cut.
const sourceSerif = Source_Serif_4({
  variable: "--font-source-serif",
  subsets: ["latin"],
  axes: ["opsz"],
  display: "swap",
});

// Handwritten accent for the client's "every detail matters." line — also
// a stand-in for the script in their company profile.
const allura = Allura({
  variable: "--font-allura",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

// The intro's greetings ("Ayubowan", "from Sri Lanka"): a fine, high-
// contrast display serif, set in italic. latin-ext for the pinyin tones.
const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin", "latin-ext"],
  weight: "400",
  style: ["normal", "italic"],
  display: "swap",
});

// Native scripts for the small line above each greeting. Script subsets
// only. Chinese deliberately falls back to the system CJK face rather
// than pulling a multi-megabyte webfont for two glyphs.
const notoSinhala = Noto_Sans_Sinhala({
  variable: "--font-noto-sinhala",
  subsets: ["sinhala"],
  weight: "300",
  display: "swap",
});

const notoDevanagari = Noto_Sans_Devanagari({
  variable: "--font-noto-devanagari",
  subsets: ["devanagari"],
  weight: "300",
  display: "swap",
});

const notoBengali = Noto_Sans_Bengali({
  variable: "--font-noto-bengali",
  subsets: ["bengali"],
  weight: "300",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "NAXIS Australia — Private Label Apparel Manufacturing",
    template: "%s — NAXIS Australia",
  },
  description: SITE_DESCRIPTION,
  // Share cards: each page's opengraph-image supplies the image.
  openGraph: {
    siteName: SITE_NAME,
    locale: "en_AU",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
};

// Structured data for search engines: only what the client has confirmed
// (name, positioning, logo). Address, phone and email join it once they
// are confirmed — see lib/contact.ts.
const ORGANIZATION_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: SITE_NAME,
  url: SITE_URL,
  logo: `${SITE_URL}/logos/naxis-wordmark.png`,
  description: SITE_DESCRIPTION,
  slogan: "Delivering excellence through experience.",
};

export const viewport: Viewport = {
  themeColor: "#100d09",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${bebasNeue.variable} ${inter.variable} ${notoSinhala.variable} ${notoDevanagari.variable} ${notoBengali.variable} ${sourceSerif.variable} ${allura.variable} ${instrumentSerif.variable} antialiased`}
    >
      <head>
        {/*
          Marks "intro already played" before <body> is parsed, so a repeat
          visitor in the same session never sees a flash of the white veil.
          This must be a raw inline script in <head>: next/script's
          beforeInteractive strategy runs too late here and the veil paints.
          React dev-warns that component-rendered scripts don't re-execute on
          client renders — which is fine, this only ever needs to run on a
          document load. It sets a class on <html>, hence the
          suppressHydrationWarning above.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(sessionStorage.getItem('naxis:intro-seen')==='done'){document.documentElement.classList.add('intro-seen')}}catch(e){}`,
          }}
        />
      </head>
      <body className="flex min-h-screen flex-col bg-ink text-cream font-body">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(ORGANIZATION_JSON_LD).replace(/</g, "\\u003c"),
          }}
        />
        <SmoothScroll />
        <RouteEffects />
        <CustomCursor />
        <ScrollProgress />
        {/* The header persists across pages; each page's content and
            footer transition beneath it (see PageShell). */}
        <Nav />
        {children}
      </body>
    </html>
  );
}
