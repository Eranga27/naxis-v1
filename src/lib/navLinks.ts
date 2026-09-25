// Shared between Nav (client) and Footer (server) — kept out of either
// component's own module so it isn't re-exported across a "use client"
// boundary, which strips plain data exports down to client references.
//
// Root-relative ("/#about", not "#about") so the same links work from
// every page. Entries point at homepage sections until their own page
// exists (docs/V1-PLAN.md), then at the page. `image` is the menu's hover
// preview.
export type NavLink = { label: string; href: string; image: string };

export const NAV_LINKS: NavLink[] = [
  { label: "Home", href: "/", image: "/images/hero-poster.jpg" },
  { label: "About", href: "/about", image: "/images/about-hero.jpg" },
  { label: "What We Make", href: "/#capabilities", image: "/images/cat1.jpg" },
  { label: "Process", href: "/#process", image: "/images/process-sewing.jpg" },
  { label: "Services", href: "/#services", image: "/images/services/manufacturing.jpg" },
  { label: "Global Network", href: "/#global-network", image: "/images/process-shipment.jpg" },
  { label: "Compliance", href: "/#certifications", image: "/images/divider-poster.jpg" },
  { label: "MOQ", href: "/#moq", image: "/images/moq-bg.jpg" },
  { label: "Start a Project", href: "/contact", image: "/images/about-design.jpg" },
];

// Where "Inquire" and every "start a project" call to action lead.
export const CONTACT_HREF = "/contact";
