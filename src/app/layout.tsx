import type { Metadata, Viewport } from "next";
import { Poppins, Inter } from "next/font/google";
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
      className={`${poppins.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-ink text-cream font-body">
        <SmoothScroll />
        <CustomCursor />
        <ScrollProgress />
        {children}
      </body>
    </html>
  );
}
