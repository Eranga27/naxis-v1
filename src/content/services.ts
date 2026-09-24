// The four service chapters from the NAXIS Australia company profile
// (client-details/NAXIS AUSTRALIA (1).pdf, pages 2-5). `body` paragraphs
// are the client's own copy, verbatim; `summary` and `highlights` are
// condensed from that same copy for the homepage cards.
//
// Single source for both the homepage ServicesStack and the
// /services/[slug] pages, so the two can't drift apart.
//
// Images are TEMPORARY stock stand-ins (from new-media/) until the client
// supplies real photography of their own facilities.

export type Service = {
  slug: string;
  number: string;
  title: string;
  /** One-line hook, shown large on the card and page. */
  summary: string;
  /** Three short points for the homepage card. */
  highlights: string[];
  /** Full client copy for the detail page. */
  body: string[];
  /** Optional ordered stages, shown as a timeline on the detail page. */
  stages?: { label: string; detail: string }[];
  pullQuote?: string;
  image: string;
  imageAlt: string;
};

export const SERVICES: Service[] = [
  {
    slug: "product-development",
    number: "01",
    title: "Product Development & Sampling",
    summary: "Product development is where ideas become garments.",
    highlights: [
      "Concept, pattern making & grading",
      "Sampling, fitting, construction & size development",
      "Right fit, quality and outcome before bulk production",
    ],
    body: [
      "At NAXIS Australia, product development is where ideas become garments. Our experienced technical and development teams manage the process from concept, pattern making and grading through sampling, fitting, construction and size development.",
      "Supported by skilled sample rooms and close collaboration with our manufacturing and material partners, we can develop, refine and prepare products for production efficiently.",
      "Our hands-on approach combines technical expertise, innovation, flexibility and speed, helping customers achieve the right fit, quality, construction and commercial outcome before moving into bulk production.",
    ],
    image: "/images/services/product-development.jpg",
    imageAlt: "Pattern drafting on a cutting table",
  },
  {
    slug: "manufacturing",
    number: "02",
    title: "Manufacturing",
    summary:
      "Streamlined capabilities and best-practice methods, built for growing international demand.",
    highlights: [
      "Best-practice production methods",
      "Latest technology, systems and facilities",
      "Lean manufacturing & management practices",
    ],
    body: [
      "NAXIS AUSTRALIA is equipped to meet the growing international demand for apparel with the development of best practice methods. We have streamlined our capabilities for inspired solutions to valued clients in a challenging environment.",
      "We employ the latest technology, systems, process, facilities, and services to maintain our positioning as an industry-leading manufacturing service provider in an ever-changing & challenging local & global marketplace.",
      "This includes highly strategic techniques of lean manufacturing and management practices, ensuring resource minimization; with the objective of becoming responsive to our customer's product requirements and maximizing our production and manufacturing outcomes.",
    ],
    image: "/images/services/manufacturing.jpg",
    imageAlt: "Garment production floor with sewing lines",
  },
  {
    slug: "quality",
    number: "03",
    title: "Quality Control & Assurance",
    summary: "Quality is a mindset — not simply a final inspection.",
    highlights: [
      "Total Quality Management (TQM)",
      "Root-cause corrective action",
      "Inspections to agreed AQL standards",
    ],
    body: [
      "At NAXIS AUSTRALIA, quality is built into every stage of the product journey. We have adopted a Total Quality Management (TQM) approach, supported by strong systems, clear standards and continuous monitoring throughout product development and manufacturing.",
      "We believe that a defect is the result of an effect — there is always an underlying cause. Our approach is therefore not only to identify defects, but to understand their root cause, take corrective action and prevent recurrence. This culture of continuous improvement helps us achieve consistent quality and reliable product performance.",
      "From raw materials to finished garments, quality is carefully monitored through material and performance testing, pre-production controls, in-line inspections and final random inspections based on agreed AQL standards.",
      "For us, quality is everyone's responsibility. It is a mindset shared across our technical, production, quality and manufacturing teams — with attention to detail at every stage.",
      "This commitment to Quality Control and Quality Assurance gives our customers confidence in every order and helps build the long-term partnerships that keep them coming back to NAXIS AUSTRALIA.",
    ],
    stages: [
      { label: "Material & performance testing", detail: "Raw materials checked before they reach the line." },
      { label: "Pre-production controls", detail: "Standards agreed and locked before bulk begins." },
      { label: "In-line inspections", detail: "Monitoring throughout production, not just at the end." },
      { label: "Final random inspections", detail: "Based on agreed AQL standards." },
    ],
    pullQuote:
      "We don't simply inspect quality at the end — we build it into the process from the beginning.",
    image: "/images/services/quality.jpg",
    imageAlt: "Quality inspector checking garments against a specification",
  },
  {
    slug: "logistics",
    number: "04",
    title: "Logistics & Freight Solutions",
    summary: "We manage the journey from factory to your doorstep.",
    highlights: [
      "Shipping documentation & freight coordination",
      "Customs clearance",
      "Final doorstep delivery",
    ],
    body: [
      "At NAXIS Australia, we manage the journey from factory to your doorstep. Through our established global network of trusted, cost-effective and efficient logistics and freight service providers, we are able to evaluate different shipping options and identify the most advantageous solution for each order — balancing cost, transit time and reliability.",
      "From shipping documentation and freight coordination to customs clearance and final doorstep delivery, NAXIS Australia manages every stage of the logistics process, helping ensure your goods move smoothly, efficiently and on time.",
    ],
    stages: [
      { label: "Shipping documentation", detail: "Paperwork prepared for every consignment." },
      { label: "Freight coordination", detail: "The best option for each order — cost, time, reliability." },
      { label: "Customs clearance", detail: "Managed as part of every stage of the journey." },
      { label: "Doorstep delivery", detail: "Final delivery to your door." },
    ],
    image: "/images/services/logistics.jpg",
    imageAlt: "Cartons being moved for dispatch",
  },
];

export const getService = (slug: string) =>
  SERVICES.find((service) => service.slug === slug);
