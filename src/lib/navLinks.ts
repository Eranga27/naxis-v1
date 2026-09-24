// Shared between Nav (client) and Footer (server) — kept out of either
// component's own module so it isn't re-exported across a "use client"
// boundary, which strips plain data exports down to client references.
export const NAV_LINKS = [
  { label: "About", href: "#about" },
  { label: "Capabilities", href: "#capabilities" },
  { label: "Process", href: "#process" },
  { label: "Global Network", href: "#global-network" },
  { label: "Certifications", href: "#certifications" },
  { label: "MOQ", href: "#moq" },
  { label: "Contact", href: "#contact" },
];
