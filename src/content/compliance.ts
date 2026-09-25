// The client's Compliance page (company profile, page 6), verbatim, and
// the certifications it lists. Shared by the homepage's compliance
// section and the Compliance page so the two can't drift apart.
export const COMPLIANCE = {
  commitment: [
    "We recognize that our customers are not only looking for quality and value, but also for partners with a good track record in social compliance.",
    "Our manufacturing facilities are committed to the highest degree of integrity in compliance with the applicable laws, regulations, and ethics that govern the company and the industry.",
  ],
  audits:
    "NAXIS AUSTRALIA Offshore manufacturing facilities participated in various independent audits that review our compliances, and we are proud to achieve excellent results.",
  // Printed on the swing tag in the page's photograph.
  tagLine: "Responsible sourcing. Stronger tomorrow.",
} as const;

// Codes and full names are as the profile lists them. Shown as type only:
// the logo artwork in the profile isn't usable (it appears re-drawn, with
// garbled lettering), so official logos need to come from the client with
// the certificates behind them — and which facility holds which is still
// [CONFIRM WITH CLIENT].
//
// `covers` describes the standard itself, from its owner's published
// scope. It says nothing about NAXIS's own certificates.
export const CERTIFICATIONS = [
  {
    code: "WRAP",
    name: "Worldwide Responsible Accredited Production",
    covers:
      "An independent certification for lawful, humane and ethical manufacturing, assessed against twelve principles, from fair pay to health and safety.",
  },
  {
    code: "SMETA",
    name: "Sedex Members Ethical Trade Audit",
    covers:
      "Sedex's social audit, covering four pillars: labour standards, health and safety, the environment and business ethics.",
  },
  {
    code: "BSCI",
    name: "Business Social Compliance Initiative",
    covers:
      "A code of conduct and audit, now run by amfori, for fair, safe and decent working conditions across global supply chains.",
  },
  {
    code: "C-TPAT",
    name: "Customs-Trade Partnership Against Terrorism",
    covers:
      "U.S. Customs and Border Protection's supply chain security programme: minimum security criteria for how goods are packed, sealed and moved.",
  },
  {
    code: "OEKO-TEX®",
    name: "Standard 100 — tested for harmful substances",
    covers:
      "Every component of a textile, from the thread to the buttons, tested by independent institutes for substances harmful to health.",
  },
] as const;
