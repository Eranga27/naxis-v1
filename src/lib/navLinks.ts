// Shared between Nav (client) and Footer (server) — kept out of either
// component's own module so it isn't re-exported across a "use client"
// boundary, which strips plain data exports down to client references.
//
// Root-relative ("/#about", not "#about") so the same links work from the
// service pages as well as the homepage.
export const NAV_LINKS = [
  { label: "About", href: "/#about" },
  { label: "What We Make", href: "/#capabilities" },
  { label: "Process", href: "/#process" },
  { label: "Services", href: "/#services" },
  { label: "Global Network", href: "/#global-network" },
  { label: "Compliance", href: "/#certifications" },
  { label: "MOQ", href: "/#moq" },
  { label: "Contact", href: "/#contact" },
];
