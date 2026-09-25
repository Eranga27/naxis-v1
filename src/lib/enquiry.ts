// The Start a Project brief: its shape, validation (shared by the form and
// the /api/enquiry route, so both reject the same things) and the plain-
// text email it becomes.
//
// The questions follow the client's own MOQ copy: "Tell us what you want to
// create, how many you need, and where you want to go with your idea."

export const STAGES = {
  idea: "Just an idea",
  references: "Sketches or references",
  ready: "Designs or tech packs ready",
} as const;

export const TIMINGS = {
  soon: "As soon as possible",
  months: "In the next 3–6 months",
  exploring: "Later — still exploring",
} as const;

export type Stage = keyof typeof STAGES;
export type Timing = keyof typeof TIMINGS;

export type Enquiry = {
  product: string;
  stage: Stage | "";
  quantity: string;
  quantityUnsure: boolean;
  timing: Timing | "";
  market: string;
  notes: string;
  name: string;
  email: string;
  company: string;
  phone: string;
  country: string;
  /** Honeypot: hidden from people, filled in by bots. */
  website: string;
};

export const EMPTY_ENQUIRY: Enquiry = {
  product: "",
  stage: "",
  quantity: "",
  quantityUnsure: false,
  timing: "",
  market: "",
  notes: "",
  name: "",
  email: "",
  company: "",
  phone: "",
  country: "",
  website: "",
};

const LIMITS: Partial<Record<keyof Enquiry, number>> = {
  product: 2000,
  notes: 3000,
  quantity: 60,
  market: 200,
  name: 120,
  email: 200,
  company: 160,
  phone: 60,
  country: 80,
  website: 200,
};

export type FieldErrors = Partial<Record<keyof Enquiry, string>>;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Which fields each step of the form asks for. */
export const STEP_FIELDS: Array<Array<keyof Enquiry>> = [
  ["product", "stage"],
  ["quantity", "quantityUnsure"],
  ["timing", "market", "notes"],
  ["name", "email", "company", "phone", "country"],
];

export function fieldErrors(enquiry: Enquiry, only?: Array<keyof Enquiry>): FieldErrors {
  const errors: FieldErrors = {};
  const check = (field: keyof Enquiry) => !only || only.includes(field);
  if (check("product") && enquiry.product.trim().length < 3) {
    errors.product = "Tell us a little about what you'd like to make.";
  }
  if (check("name") && enquiry.name.trim().length < 2) {
    errors.name = "Please add your name.";
  }
  if (check("email") && !EMAIL.test(enquiry.email.trim())) {
    errors.email = "Please add an email address we can reply to.";
  }
  for (const [field, max] of Object.entries(LIMITS) as Array<[keyof Enquiry, number]>) {
    const value = enquiry[field];
    if (check(field) && typeof value === "string" && value.length > max) {
      errors[field] = `Please keep this under ${max} characters.`;
    }
  }
  return errors;
}

/** Parses untrusted input (the route's request body) into an Enquiry. */
export function parseEnquiry(input: unknown):
  | { ok: true; enquiry: Enquiry }
  | { ok: false; errors: FieldErrors } {
  if (!input || typeof input !== "object") return { ok: false, errors: {} };
  const raw = input as Record<string, unknown>;
  const text = (key: keyof Enquiry) =>
    typeof raw[key] === "string" ? (raw[key] as string).trim() : "";
  const stage = text("stage");
  const timing = text("timing");
  const enquiry: Enquiry = {
    product: text("product"),
    stage: stage in STAGES ? (stage as Stage) : "",
    quantity: text("quantity"),
    quantityUnsure: raw.quantityUnsure === true,
    timing: timing in TIMINGS ? (timing as Timing) : "",
    market: text("market"),
    notes: text("notes"),
    name: text("name"),
    email: text("email"),
    company: text("company"),
    phone: text("phone"),
    country: text("country"),
    website: text("website"),
  };
  const errors = fieldErrors(enquiry);
  return Object.keys(errors).length ? { ok: false, errors } : { ok: true, enquiry };
}

export const quantityLabel = (enquiry: Enquiry) =>
  enquiry.quantityUnsure || !enquiry.quantity.trim()
    ? "quantity to be discussed"
    : `around ${enquiry.quantity.trim()} units`;

export const timingLabel = (enquiry: Enquiry) =>
  enquiry.timing ? TIMINGS[enquiry.timing] : "timing open";

export const enquirySubject = (enquiry: Enquiry) =>
  `Project brief — ${enquiry.company.trim() || enquiry.name.trim()}`;

/** The brief as a plain-text email (plain text: nothing to escape). */
export function enquiryEmailText(enquiry: Enquiry): string {
  const lines = [
    "A new project brief from the NAXIS Australia website.",
    "",
    "WHAT THEY WANT TO CREATE",
    enquiry.product,
    enquiry.stage ? `Where they're at: ${STAGES[enquiry.stage]}` : "",
    "",
    "HOW MANY",
    quantityLabel(enquiry),
    "",
    "WHERE THEY WANT TO GO WITH IT",
    `Timing: ${timingLabel(enquiry)}`,
    enquiry.market ? `Selling: ${enquiry.market}` : "",
    enquiry.notes ? `Notes: ${enquiry.notes}` : "",
    "",
    "CONTACT",
    `Name: ${enquiry.name}`,
    `Email: ${enquiry.email}`,
    enquiry.company ? `Brand / company: ${enquiry.company}` : "",
    enquiry.phone ? `Phone: ${enquiry.phone}` : "",
    enquiry.country ? `Country: ${enquiry.country}` : "",
  ];
  return lines.filter((line, i, all) => line !== "" || all[i - 1] !== "").join("\n");
}
