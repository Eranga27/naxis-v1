// Shared between Nav (client) and Footer (server) — kept out of either
// component's own module so it isn't re-exported across a "use client"
// boundary, which strips plain data exports down to client references.

// "Capabilities" points at Mission for now — the dedicated capabilities
// content (formerly Mission's "What we make" list) is being folded into a
// later section rather than living here, so there's no standalone target
// for it yet.
export const NAV_LINKS = [
  { label: "Capabilities", href: "#mission" },
  { label: "Global Network", href: "#global-network" },
  { label: "Certifications", href: "#certifications" },
  { label: "Contact", href: "#contact" },
];
