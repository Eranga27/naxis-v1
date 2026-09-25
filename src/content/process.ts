// The process from the client's company profile (page 1 diagram):
// Design → Pattern Making → Sampling → Sourcing → Sewing
// → Quality Control → Order Shipment → Your Success.
// The diagram names the stages only; the descriptions were written for
// the homepage. Shared by the homepage timeline and How We Work. The
// first seven have photos; "Your Success" is the close (SUCCESS_STEP),
// as in the client's own diagram.
export type ProcessStep = {
  number: string;
  label: string;
  description: string;
  image: string;
  imageAlt: string;
  /** The service page where this stage is covered, if one is. */
  service?: string;
};

export const PROCESS_STEPS: ProcessStep[] = [
  {
    number: "01",
    label: "Design",
    service: "product-development",
    description:
      "Our design team works closely with your brand to translate ideas into technical specifications — tech packs, CADs, fabric recommendations and construction details.",
    image: "/images/about-design.jpg",
    imageAlt: "Design and technical pack development",
  },
  {
    number: "02",
    label: "Pattern Making",
    service: "product-development",
    description:
      "Precision pattern drafting transforms designs into production-ready templates. Every seam, measurement and tolerance is engineered for consistency at scale.",
    image: "/images/process-pattern-making.jpg",
    imageAlt: "Pattern making and grading",
  },
  {
    number: "03",
    label: "Sampling",
    service: "product-development",
    description:
      "Pre-production samples are crafted and sent for approval before mass production begins — ensuring fit, finish and fabric performance match the specification exactly.",
    image: "/images/process-sampling.jpg",
    imageAlt: "Garment sampling and approval",
  },
  {
    number: "04",
    label: "Sourcing",
    description:
      "Leveraging our global supplier network, we source the right fabrics, trims and accessories — balancing quality, lead time and cost to meet your program requirements.",
    image: "/images/about-fabric.jpg",
    imageAlt: "Fabric and trim sourcing",
  },
  {
    number: "05",
    label: "Sewing",
    service: "manufacturing",
    description:
      "Production runs through our own facilities and specialist partner factories, operating to strict quality and ethical standards. Every line, every stitch — supervised and on-spec.",
    image: "/images/process-sewing.jpg",
    imageAlt: "Garment sewing and production",
  },
  {
    number: "06",
    label: "Quality Control",
    service: "quality",
    description:
      "Multi-point quality audits are conducted throughout production and at final inspection — ensuring every unit leaving the factory meets your exact brief.",
    image: "/images/process-qc.jpg",
    imageAlt: "Quality control and inspection",
  },
  {
    number: "07",
    label: "Order Shipment",
    service: "logistics",
    description:
      "End-to-end logistics management — from factory floor to your warehouse. We coordinate freight, customs documentation and final delivery to your door.",
    image: "/images/process-shipment.jpg",
    imageAlt: "Packing and order shipment",
  },
];

export const SUCCESS_STEP = { number: "08", label: "Your Success" } as const;

// The copy beside the diagram, verbatim.
export const PROCESS_INTRO = {
  oneOnOne:
    "We work one on one with clients to help them create their own private label clothing line.",
  detail: "In apparel production, every detail matters.",
  focus: "We focus on the details so you can focus on your customers.",
} as const;

// How We Work as the next chapter, for the pages that lead on to it: the
// Services hub, and the last service, so the services end there rather
// than looping back to the first.
export const PROCESS_CHAPTER = {
  href: "/how-we-work",
  label: "Next · How we work",
  title: "Every detail matters.",
  summary: PROCESS_INTRO.focus,
  image: { src: "/images/process-sewing.jpg", alt: "Kraft paper garment patterns hanging on a rail" },
  morphName: "hero-how-we-work",
} as const;
