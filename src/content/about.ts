// The client's "About NAXIS Australia" artboard (ivory background),
// verbatim, plus their process-diagram lines (company profile, page 1).
// Every string here is theirs; the About page only arranges them.

export const ABOUT = {
  heading: "About NAXIS Australia",
  paragraphs: [
    "NAXIS Australia is an Australian-based apparel product development, manufacturing and complete supply chain solutions company, supported by our own manufacturing facilities and a trusted global network of specialised partner factories.",
    "Backed by decades of hands-on apparel industry experience, we manage the complete journey — from concept, design and product development through sourcing, manufacturing, quality assurance, logistics and final delivery.",
    "With direct access to our own factories and specialist manufacturing partners, we offer the flexibility, technical expertise and production capability to support small to large-scale manufacturing programs across a diverse range of apparel.",
    "We believe great apparel is built through experience, innovation, integrity and strong partnerships. We don't simply source products — we take responsibility for the entire journey, from factory floor to your door.",
  ],
  tagline: "From Concept to Creation. Factory to You.",
  belief: "We believe great apparel is built through experience, innovation, integrity and strong partnerships.",
} as const;

// The tagline's four words as the page's chapters, each paired with the
// client line that speaks to it.
export const ABOUT_CHAPTERS = [
  {
    word: "Concept",
    text: ABOUT.paragraphs[1],
    image: "/images/about-design.jpg",
    alt: "Designer sketching garment ideas",
  },
  {
    word: "Creation",
    text: "We work one on one with clients to help them create their own private label clothing line. In apparel production, every detail matters.",
    image: "/images/process-sampling.jpg",
    alt: "Garment sample being prepared",
  },
  {
    word: "Factory",
    text: ABOUT.paragraphs[2],
    image: "/images/services/manufacturing.jpg",
    alt: "Garment production floor with sewing lines",
  },
  {
    word: "You",
    text: "We don't simply source products — we take responsibility for the entire journey, from factory floor to your door.",
    image: "/images/process-shipment.jpg",
    alt: "Finished orders packed for shipment",
  },
] as const;

export const BELIEFS = ["Experience", "Innovation", "Integrity", "Strong partnerships"] as const;
