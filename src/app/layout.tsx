import type { Metadata, Viewport } from "next";
import {
  Poppins,
  Anton,
  Inter,
  Noto_Sans_Sinhala,
  Noto_Sans_Devanagari,
  Noto_Sans_Bengali,
} from "next/font/google";
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
  subsets: ["latin", "latin-ext"],
  weight: ["300", "400", "500", "600"],
  display: "swap",
});

// Native scripts for the intro greetings. Script subsets only — Latin comes
// from Inter, which sits first in the greeting stack. Chinese deliberately
// falls back to the system CJK face rather than pulling a multi-megabyte
// webfont for two glyphs.
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
      suppressHydrationWarning
      className={`${poppins.variable} ${anton.variable} ${inter.variable} ${notoSinhala.variable} ${notoDevanagari.variable} ${notoBengali.variable} antialiased`}
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
        <SmoothScroll />
        <CustomCursor />
        <ScrollProgress />
        {children}
      </body>
    </html>
  );
}
