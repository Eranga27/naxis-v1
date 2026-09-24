// Single source for the site's contact details, shared by the Closing CTA
// and the Footer so they can't drift apart.
//
// None of these are confirmed yet. They're deliberately left as the
// literal placeholder (producing obviously-broken links) rather than a
// plausible-looking invented address or number — replace each once the
// client confirms it.
export const CONTACT = {
  email: "[CONFIRM WITH CLIENT]",
  phone: "[CONFIRM WITH CLIENT]",
  // Digits only, international format without "+" — the form wa.me expects.
  whatsapp: "[CONFIRM WITH CLIENT]",
} as const;
