// Line icons for the direct contact channels (Call / WhatsApp / Email),
// shared by the homepage closing CTA and the Start a Project page.
// Decorative: the link text carries the meaning.

export function PhoneIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className={className} aria-hidden="true">
      <path
        d="M6.5 3h3l1.5 4-2 1.5c.9 2 2.6 3.7 4.6 4.6l1.5-2 4 1.5v3c0 1-1 2-2.2 1.9C10.6 17 6.5 13 5.1 6.7 5 5.5 5.5 4 6.5 3z"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function WhatsAppIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className={className} aria-hidden="true">
      <path
        d="M4 20l1.3-4A8 8 0 1112 20a8 8 0 01-4-1.1L4 20z"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <path d="M8.5 9.5c.3 2.5 2.5 4.7 5 5" strokeLinecap="round" />
    </svg>
  );
}

export function MailIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className={className} aria-hidden="true">
      <rect x="2" y="4" width="20" height="16" rx="2" strokeLinejoin="round" />
      <path d="M2 7l10 7 10-7" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}
