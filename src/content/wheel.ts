// The client's "Giant Wheel" (client-details/NAXIS GIANT WHEEL - v2.pdf):
// six values round the rim, "Delivering excellence through experience",
// NAXIS Australia, and a disc of Australian icons about the N. The
// artwork itself is generated into giantWheel.ts by
// scripts/build-giant-wheel.py.
//
// The six words are the wheel's own, in its clockwise order from the top.
// Each is paired with a line of the client's own copy that bears it out,
// verbatim (trimmed only at the ends, marked with an ellipsis), and the
// page that line comes from. The pairings are ours; the words aren't.
export const WHEEL_VALUES = [
  {
    word: "Quality",
    line: "Quality is built into every stage of the product journey.",
    source: { label: "Quality Control & Assurance", href: "/services/quality" },
  },
  {
    word: "Reliability",
    line: "…the most advantageous solution for each order — balancing cost, transit time and reliability.",
    source: { label: "Logistics & Freight", href: "/services/logistics" },
  },
  {
    word: "Flawless",
    line: "In apparel production, every detail matters.",
    source: { label: "How we work", href: "/how-we-work" },
  },
  {
    word: "Flexible",
    line: "…the flexibility, technical expertise and production capability to support small to large-scale manufacturing programs.",
    source: { label: "About NAXIS", href: "/about" },
  },
  {
    word: "Fast",
    line: "Our hands-on approach combines technical expertise, innovation, flexibility and speed.",
    source: { label: "Product Development & Sampling", href: "/services/product-development" },
  },
  {
    word: "Integrity",
    line: "Our manufacturing facilities are committed to the highest degree of integrity…",
    source: { label: "Compliance", href: "/compliance" },
  },
] as const;
